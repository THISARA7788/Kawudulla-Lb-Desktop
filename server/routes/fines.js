const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Fine = require('../models/Fine');
const FineConfig = require('../models/FineConfig');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');

// All routes require librarian role
router.use(protect, authorize('librarian'));

/**
 * Automatically calculates and generates/updates fine records for all active unreturned overdue borrows.
 */
const syncActiveOverdueFines = async () => {
  try {
    const config = (await FineConfig.findOne()) || { fineRatePerDay: 10, gracePeriodDays: 0 };
    const now = new Date();

    const overdueTransactions = await Transaction.find({
      returnDate: null,
      dueDate: { $lt: now },
      status: { $ne: 'returned' },
    });

    for (const tx of overdueTransactions) {
      const dueDate = new Date(tx.dueDate);
      const graceEnd = new Date(dueDate.getTime() + (Number(config.gracePeriodDays) || 0) * 86400000);
      if (now <= graceEnd) continue;

      const daysOverdue = Math.max(1, Math.floor((now - graceEnd) / 86400000));
      const amount = daysOverdue * (Number(config.fineRatePerDay) || 10);

      // Update transaction status and overdue days
      if (tx.status !== 'overdue' || tx.overdueDays !== daysOverdue) {
        tx.status = 'overdue';
        tx.overdueDays = daysOverdue;
        await tx.save();
      }

      // Check if fine already exists for this transaction
      let fine = await Fine.findOne({ transaction: tx._id });
      if (!fine) {
        // Auto-create fine record for active overdue borrow
        await Fine.create({
          transaction: tx._id,
          user: tx.user,
          book: tx.book,
          amount: amount,
          daysOverdue: daysOverdue,
          ratePerDay: Number(config.fineRatePerDay) || 10,
          status: 'unpaid',
          notes: 'Auto-calculated for active overdue borrow',
        });
      } else if (fine.status === 'unpaid') {
        // If still unpaid, keep amount and daysOverdue updated dynamically
        if (fine.daysOverdue !== daysOverdue || fine.amount !== amount) {
          fine.daysOverdue = daysOverdue;
          fine.amount = amount;
          fine.ratePerDay = Number(config.fineRatePerDay) || 10;
          await fine.save();
        }
      }
    }
  } catch (err) {
    console.warn('Sync active overdue fines warning:', err.message);
  }
};

// GET /api/library/fines/config
router.get('/config', async (req, res) => {
  try {
    let config = await FineConfig.findOne();
    if (!config) {
      config = await FineConfig.create({ fineRatePerDay: 10, gracePeriodDays: 0 });
    }
    res.json({ config });
  } catch (err) {
    console.error('Get fines config error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/library/fines/config
router.put('/config', async (req, res) => {
  try {
    let config = await FineConfig.findOne();
    if (!config) {
      config = await FineConfig.create(req.body);
    } else {
      if (req.body.fineRatePerDay !== undefined) config.fineRatePerDay = Number(req.body.fineRatePerDay);
      if (req.body.gracePeriodDays !== undefined) config.gracePeriodDays = Number(req.body.gracePeriodDays);
      await config.save();
    }
    // Re-sync overdue fines with new rate/grace period
    await syncActiveOverdueFines();
    res.json({ config });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/library/fines/stats
router.get('/stats', async (req, res) => {
  try {
    // Auto-sync unreturned overdue fines before calculating stats
    await syncActiveOverdueFines();

    const unpaid = await Fine.aggregate([{ $match: { status: 'unpaid' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    const paid = await Fine.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    const waived = await Fine.aggregate([{ $match: { status: 'waived' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    res.json({
      unpaidTotal: unpaid[0]?.total || 0,
      unpaidCount: unpaid[0]?.count || 0,
      paidTotal: paid[0]?.total || 0,
      paidCount: paid[0]?.count || 0,
      waivedTotal: waived[0]?.total || 0,
      waivedCount: waived[0]?.count || 0,
    });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/library/fines/pending - find overdue transactions without fines
router.get('/pending', async (req, res) => {
  try {
    await syncActiveOverdueFines();
    const config = (await FineConfig.findOne()) || { fineRatePerDay: 10, gracePeriodDays: 0 };
    const now = new Date();

    const overdueTransactions = await Transaction.find({
      status: { $in: ['active', 'overdue'] },
      returnDate: null,
    })
      .populate('user', 'memberId name email role grade')
      .populate('book', 'bookId title author coverImageUrl')
      .populate('issuedBy', 'name');

    const existingFineTxIds = new Set(
      (await Fine.find({ status: 'unpaid' }, 'transaction')).map((f) => f.transaction.toString())
    );

    const pendingFines = [];
    for (const tx of overdueTransactions) {
      const dueDate = new Date(tx.dueDate);
      const graceEnd = new Date(dueDate.getTime() + config.gracePeriodDays * 86400000);
      if (now <= graceEnd) continue;

      const daysOverdue = Math.ceil((now - graceEnd) / 86400000);
      const amount = daysOverdue * config.fineRatePerDay;

      pendingFines.push({
        transaction: tx,
        hasExistingFine: existingFineTxIds.has(tx._id.toString()),
        daysOverdue,
        ratePerDay: config.fineRatePerDay,
        amount,
      });
    }

    res.json({ pendingFines, config });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/library/fines - create fine for a transaction
router.post('/', async (req, res) => {
  try {
    const { transactionId, amount, daysOverdue, ratePerDay, notes } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const existing = await Fine.findOne({ transaction: transactionId, status: 'unpaid' });
    if (existing) return res.status(400).json({ message: 'Fine already exists for this transaction' });

    const fine = await Fine.create({
      transaction: tx._id,
      user: tx.user,
      book: tx.book,
      amount: Number(amount) || 0,
      daysOverdue: Number(daysOverdue) || 0,
      ratePerDay: Number(ratePerDay) || 0,
      notes: notes || '',
    });

    const populated = await Fine.findById(fine._id)
      .populate('user', 'memberId name email role grade')
      .populate('book', 'bookId title author coverImageUrl');

    res.status(201).json({ fine: populated });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/library/fines
router.get('/', async (req, res) => {
  try {
    // Automatically synchronize and generate fines for unreturned overdue books
    await syncActiveOverdueFines();

    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');

      const [matchingUsers, matchingBooks, matchingTxs] = await Promise.all([
        User.find({ $or: [{ name: regex }, { memberId: regex }, { email: regex }] }).select('_id'),
        Book.find({ $or: [{ title: regex }, { bookId: regex }, { isbn: regex }, { author: regex }] }).select('_id'),
        Transaction.find({ transactionId: regex }).select('_id'),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const bookIds = matchingBooks.map((b) => b._id);
      const txIds = matchingTxs.map((t) => t._id);

      query.$or = [
        { fineId: regex },
        { user: { $in: userIds } },
        { book: { $in: bookIds } },
        { transaction: { $in: txIds } },
      ];
    }

    const total = await Fine.countDocuments(query);
    const parsedLimit = Math.max(1, Number(limit) || 20);
    const parsedPage = Math.max(1, Number(page) || 1);

    const fines = await Fine.find(query)
      .populate('user', 'memberId name email role grade')
      .populate('book', 'bookId title author coverImageUrl')
      .populate('transaction', 'transactionId dueDate issueDate returnDate')
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.json({
      fines,
      total,
      count: total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/library/fines/:id/pay
router.put('/:id/pay', async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    fine.status = 'paid';
    fine.paidAt = new Date();
    if (req.body.notes) fine.notes += (fine.notes ? ' | ' : '') + req.body.notes;
    await fine.save();
    res.json({ fine });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/library/fines/:id/waive
router.put('/:id/waive', async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    fine.status = 'waived';
    fine.waivedReason = req.body.reason || '';
    await fine.save();
    res.json({ fine });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/library/fines/:id
router.delete('/:id', async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    await fine.deleteOne();
    res.json({ message: 'Fine deleted' });
  } catch (err) {
    console.error('Fines operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/library/transactions/:id
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Delete related fines first
    await Fine.deleteMany({ transaction: transaction._id });

    // Delete the transaction
    await transaction.deleteOne();

    res.json({ message: 'Transaction and related fines deleted' });
  } catch (err) {
    console.error('Transaction operation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.syncActiveOverdueFines = syncActiveOverdueFines;
