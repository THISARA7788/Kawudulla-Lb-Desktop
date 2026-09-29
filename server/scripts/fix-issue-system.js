const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

const transactionCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const TransactionCounter =
  mongoose.models.TransactionCounter ||
  mongoose.model('TransactionCounter', transactionCounterSchema);

async function fixIssueSystem() {
  await connectDB();
  console.log('=== FIXING TRANSACTION COUNTER & BOOK INVENTORIES ===');

  // 1. Sync TransactionCounter with highest transaction number
  const allTxs = await Transaction.find({ transactionId: /^TRN-\d+$/ });
  let maxSeq = 0;
  for (const tx of allTxs) {
    const num = parseInt(tx.transactionId.replace('TRN-', ''), 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  const totalCount = await Transaction.countDocuments();
  const targetSeq = Math.max(maxSeq, totalCount);
  await TransactionCounter.findByIdAndUpdate(
    'transactionId',
    { seq: targetSeq },
    { upsert: true, new: true }
  );
  console.log(`✅ TransactionCounter 'transactionId' initialized to: ${targetSeq}`);

  // 2. Find and fix active transactions that point to non-existent users
  const activeTxs = await Transaction.find({ status: { $in: ['active', 'overdue'] }, returnDate: null });
  let orphanedCount = 0;
  for (const tx of activeTxs) {
    const userExists = await User.findById(tx.user);
    if (!userExists) {
      orphanedCount++;
      tx.status = 'returned';
      tx.returnDate = new Date();
      tx.notes = (tx.notes ? tx.notes + ' ' : '') + '[Auto-returned: member account was previously deleted]';
      await tx.save();
      console.log(`Resolved orphaned active transaction ${tx.transactionId || tx._id} for non-existent user.`);
    }
  }
  console.log(`✅ Cleaned up ${orphanedCount} orphaned active transactions.`);

  // 3. Recalculate availableCopies for all books
  const books = await Book.find({});
  let fixedBooks = 0;
  for (const b of books) {
    const activeBorrows = await Transaction.countDocuments({
      book: b._id,
      status: { $in: ['active', 'overdue'] },
      returnDate: null
    });
    const correctAvailable = Math.max(0, (b.totalCopies || 1) - activeBorrows);
    if (b.availableCopies !== correctAvailable) {
      console.log(`Restoring book "${b.title}" (ID: ${b.bookId}): availableCopies ${b.availableCopies} -> ${correctAvailable}`);
      b.availableCopies = correctAvailable;
      await b.save();
      fixedBooks++;
    }
  }
  console.log(`✅ Corrected available copies for ${fixedBooks} books.`);

  // 4. Test creating a transaction with our updated pre-save hook
  const activeUser = await User.findOne({ role: 'student', status: 'active' });
  const sampleBook = await Book.findOne({ availableCopies: { $gt: 0 } });
  const admin = await User.findOne({ role: 'librarian' });

  if (activeUser && sampleBook && admin) {
    console.log(`\nTesting issue transaction generation for user: ${activeUser.name}...`);
    const testTx = new Transaction({
      user: activeUser._id,
      book: sampleBook._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      notes: 'Automated test issue validation',
      issuedBy: admin._id,
      status: 'active'
    });
    await testTx.save();
    console.log(`✅ Verified test transaction created successfully: ID=${testTx.transactionId}`);
    
    // Clean up test transaction & restore counter
    await Transaction.deleteOne({ _id: testTx._id });
    await TransactionCounter.findByIdAndUpdate('transactionId', { seq: targetSeq });
    console.log(`✅ Test transaction verified and cleaned up.`);
  }

  console.log('\n🎉 System is fully fixed and verified!');
  process.exit(0);
}

fixIssueSystem().catch(err => {
  console.error('Fix script failed:', err);
  process.exit(1);
});
