// server/scripts/verify-cleanup.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const User = require('../models/User');
const Book = require('../models/Book');
const FineConfig = require('../models/FineConfig');

// Load environment variables
dotenv.config();

const verifyCleanup = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    console.log('\n🔍 Verifying cleanup...');
    
    // Get current date and fine config
    const now = new Date();
    const config = await FineConfig.findOne() || { fineRatePerDay: 10, gracePeriodDays: 0 };
    
    // Find all overdue transactions
    const allOverdueTransactions = await Transaction.find({
      status: { $in: ['active', 'overdue'] },
      returnDate: null,
    }).populate('user', 'name email').populate('book', 'title bookId');
    
    console.log(`\n📊 Total overdue transactions: ${allOverdueTransactions.length}`);
    
    // Calculate days overdue for each transaction
    let totalDaysOverdue = 0;
    let maxDaysOverdue = 0;
    let problematicRecords = [];
    
    for (const transaction of allOverdueTransactions) {
      const graceEnd = new Date(transaction.dueDate.getTime() + config.gracePeriodDays * 86400000);
      const daysOverdue = Math.ceil((now - graceEnd) / 86400000);
      
      if (daysOverdue > 0) {
        totalDaysOverdue += daysOverdue;
        if (daysOverdue > maxDaysOverdue) {
          maxDaysOverdue = daysOverdue;
        }
        
        // Check if this is a problematic record
        if (daysOverdue > 60) {
          problematicRecords.push({
            transactionId: transaction.transactionId,
            userName: transaction.user?.name || 'Unknown',
            userEmail: transaction.user?.email || 'Unknown',
            bookTitle: transaction.book?.title || 'Unknown',
            bookId: transaction.book?.bookId || 'Unknown',
            daysOverdue,
            dueDate: transaction.dueDate.toISOString().split('T')[0]
          });
        }
      }
    }
    
    console.log(`\n📊 Overdue statistics:`);
    console.log(`   - Total days overdue across all transactions: ${totalDaysOverdue}`);
    console.log(`   - Maximum days overdue: ${maxDaysOverdue}`);
    console.log(`   - Average days overdue: ${allOverdueTransactions.length > 0 ? (totalDaysOverdue / allOverdueTransactions.length).toFixed(1) : 0}`);
    
    if (problematicRecords.length > 0) {
      console.log(`\n⚠️  Found ${problematicRecords.length} potentially problematic overdue records (over 60 days):`);
      problematicRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.transactionId} - ${record.userName} (${record.userEmail}) - ${record.bookTitle} (${record.bookId}) - ${record.daysOverdue} days overdue (due: ${record.dueDate})`);
      });
    } else {
      console.log('\n✅ No problematic overdue records found (all under 60 days overdue).');
    }
    
    // Check for orphaned records
    console.log('\n🔍 Checking for orphaned records...');
    
    const orphanedTransactions = await Transaction.find({
      $or: [
        { user: { $exists: true } },
        { book: { $exists: true } }
      ]
    }).populate('user', 'name email').populate('book', 'title bookId');
    
    let orphanedCount = 0;
    for (const transaction of orphanedTransactions) {
      const userExists = transaction.user ? await User.exists({ _id: transaction.user._id }) : false;
      const bookExists = transaction.book ? await Book.exists({ _id: transaction.book._id }) : false;
      
      if (!userExists || !bookExists) {
        orphanedCount++;
        console.log(`   ⚠️  Orphaned transaction: ${transaction.transactionId || 'Unknown'} - User exists: ${userExists}, Book exists: ${bookExists}`);
      }
    }
    
    console.log(`\n📊 Orphaned records found: ${orphanedCount}`);
    
    console.log('\n✅ Verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
    console.log('\n📴 Database connection closed.');
    process.exit(0);
  }
};

verifyCleanup();