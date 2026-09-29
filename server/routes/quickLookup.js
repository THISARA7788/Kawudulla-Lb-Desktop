// =========================================================================
// WHAT DOES THIS FILE DO?
// This endpoint parses scans/text inputs. It checks prefixes to find:
// - Member Profiles: if input begins with 'KMV-' (case-insensitive)
// - Book Records: if input begins with 'BK' (case-insensitive)
// Returns complete metadata records, active borrows, and totals.
// =========================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

// All protected
router.use(protect);

// GET /api/library/quick-lookup/:id
router.get('/quick-lookup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trimmed = id.trim();

    // 1. Try to find user by memberId (case-insensitive) or MongoDB _id (students/teachers only)
    let user = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      user = await User.findOne({ _id: trimmed, role: { $ne: 'librarian' } }, '-password -borrowedBooks -resetToken -resetTokenExpiry');
    }
    if (!user) {
      user = await User.findOne({ memberId: trimmed.toUpperCase(), role: { $ne: 'librarian' } }, '-password -borrowedBooks -resetToken -resetTokenExpiry');
    }
    
    if (user) {
      const Fine = require('../models/Fine');
      const populatedUser = await User.findById(user._id, '-password -borrowedBooks -resetToken -resetTokenExpiry')
        .populate('borrowedBooks.book', 'bookId title author coverImageUrl');
        
      const activeBorrows = await Transaction.find({ user: user._id, status: 'active' })
        .populate('book', 'bookId title author coverImageUrl')
        .sort({ issueDate: -1 })
        .limit(10);

      const totalBorrows = await Transaction.countDocuments({ user: user._id });
      
      const activeFines = await Fine.find({ user: user._id, status: 'unpaid' })
        .populate('book', 'bookId title author coverImageUrl')
        .populate('transaction', 'transactionId dueDate');

      // Calculate annual borrowing stats for the current year
      const requestedYear = parseInt(req.query.year) || new Date().getFullYear();
      const allUserTransactions = await Transaction.find(
        { user: user._id },
        'issueDate createdAt'
      ).lean();

      // Collect available years
      const yearsSet = new Set([requestedYear, new Date().getFullYear()]);
      allUserTransactions.forEach((t) => {
        const d = new Date(t.issueDate || t.createdAt);
        if (!isNaN(d.getTime())) {
          yearsSet.add(d.getFullYear());
        }
      });
      const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCounts = Array(12).fill(0);

      allUserTransactions.forEach((t) => {
        const d = new Date(t.issueDate || t.createdAt);
        if (!isNaN(d.getTime()) && d.getFullYear() === requestedYear) {
          monthlyCounts[d.getMonth()] += 1;
        }
      });

      const monthly = months.map((month, idx) => ({
        month,
        monthIndex: idx,
        count: monthlyCounts[idx]
      }));

      const totalThisYear = monthlyCounts.reduce((acc, curr) => acc + curr, 0);

      const yearlyStats = {
        year: requestedYear,
        monthly,
        totalThisYear,
        availableYears
      };

      return res.json({
        type: 'member',
        member: populatedUser,
        activeBorrows,
        totalBorrows,
        activeFines,
        yearlyStats,
      });
    }

    // 2. Try to find book by bookId or isbn (handling spaces and hyphens)
    const isbnCleaned = trimmed.replace(/[-\s]/g, '');
    const book = await Book.findOne({
      $or: [
        { bookId: trimmed.toUpperCase() },
        { isbn: trimmed },
        { isbn: isbnCleaned }
      ]
    });

    if (book) {
      const activeTransactions = await Transaction.find({ book: book._id, status: { $in: ['active', 'overdue'] } })
        .populate('user', 'name email memberId grade class role')
        .populate('book', 'bookId title author isbn category coverImageUrl');

      return res.json({
        type: 'book',
        book,
        activeTransactions: activeTransactions || []
      });
    }

    // 3. Try to search by member name or book name (fallback case-insensitive search)
    const matchedUsers = await User.find({
      name: { $regex: trimmed, $options: 'i' },
      status: 'active',
      role: { $ne: 'librarian' }
    }, '-password -borrowedBooks -resetToken -resetTokenExpiry').limit(10);

    const cleanQuery = trimmed.replace(/[-\s]/g, '');
    const matchedBooks = await Book.find({
      $or: [
        { title: { $regex: trimmed, $options: 'i' } },
        { author: { $regex: trimmed, $options: 'i' } },
        { bookId: { $regex: trimmed, $options: 'i' } },
        { bookId: { $regex: cleanQuery, $options: 'i' } },
        { isbn: { $regex: trimmed, $options: 'i' } },
        { isbn: { $regex: cleanQuery, $options: 'i' } }
      ],
      isDeleted: { $ne: true }
    }).limit(10);

    const matchedBookIds = matchedBooks.map(b => b._id);

    const activeTransactions = await Transaction.find({
      book: { $in: matchedBookIds },
      status: { $in: ['active', 'overdue'] }
    })
      .populate('book', 'bookId title author isbn category coverImageUrl')
      .populate('user', 'name email memberId grade class role')
      .sort({ dueDate: 1 })
      .limit(10);

    if (matchedUsers.length > 0 || activeTransactions.length > 0) {
      return res.json({
        type: 'search_results',
        members: matchedUsers,
        activeTransactions: activeTransactions
      });
    }

    return res.status(404).json({ message: `No member or book found matching "${trimmed}"` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
