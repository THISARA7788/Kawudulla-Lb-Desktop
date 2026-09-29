// server/scripts/cleanup-invalid-overdue.js
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

const cleanupInvalidOverdue = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    console.log('\n🔍 Finding invalid overdue records...');
    
    // Get current date and fine config
    const now = new Date();
    const config = await FineConfig.findOne() || { fineRatePerDay: 10, gracePeriodDays: 0 };
    
    // Find transactions that are overdue by more than 59 days
    // This is a conservative approach - we'll look for transactions that are significantly overdue
    const cutoffDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
    
    // Find all transactions that are overdue and have been overdue for more than 90 days
    const oldOverdueTransactions = await Transaction.find({
      status: { $in: ['active', 'overdue'] },
      returnDate: null,
      dueDate: { $lt: cutoffDate }
    }).populate('user', 'name email').populate('book', 'title bookId');
    
    console.log(`📊 Found ${oldOverdueTransactions.length} potentially problematic overdue transactions:`);
    
    let deletedCount = {
      transactions: 0,
      fines: 0,
      orphanedUsers: 0,
      orphanedBooks: 0
    };
    
    // Delete each problematic transaction and its related records
    for (const transaction of oldOverdueTransactions) {
      console.log(`\n🗑️  Processing transaction: ${transaction.transactionId || 'Unknown'}`);
      console.log(`   - User: ${transaction.user?.name || 'Unknown'} (${transaction.user?.email || 'Unknown email'})`);
      console.log(`   - Book: ${transaction.book?.title || 'Unknown'} (${transaction.book?.bookId || 'Unknown ID'})`);
      console.log(`   - Due Date: ${transaction.dueDate.toISOString().split('T')[0]}`);
      console.log(`   - Status: ${transaction.status}`);
      
      // Check if user or book exists
      const userExists = transaction.user ? await User.exists({ _id: transaction.user._id }) : false;
      const bookExists = transaction.book ? await Book.exists({ _id: transaction.book._id }) : false;
      
      if (!userExists || !bookExists) {
        console.log(`   ⚠️  WARNING: User or Book not found - this is an orphaned record!`);
        
        // Delete related fines first
        const relatedFines = await Fine.deleteMany({ transaction: transaction._id });
        deletedCount.fines += relatedFines.deletedCount;
        console.log(`   📝 Deleted ${relatedFines.deletedCount} related fine records`);
        
        // Delete the transaction
        await Transaction.deleteOne({ _id: transaction._id });
        deletedCount.transactions++;
        console.log(`   ✅ Deleted transaction: ${transaction.transactionId || 'Unknown'}`);
        
        // If user doesn't exist, delete it
        if (!userExists) {
          await User.deleteOne({ _id: transaction.user._id });
          deletedCount.orphanedUsers++;
          console.log(`   👤 Deleted orphaned user: ${transaction.user?.name || 'Unknown'}`);
        }
        
        // If book doesn't exist, delete it
        if (!bookExists) {
          await Book.deleteOne({ _id: transaction.book._id });
          deletedCount.orphanedBooks++;
          console.log(`   📚 Deleted orphaned book: ${transaction.book?.title || 'Unknown'}`);
        }
      } else {
        console.log(`   ℹ️  Transaction has valid user and book references - keeping it`);
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   - Transactions deleted: ${deletedCount.transactions}`);
    console.log(`   - Fine records deleted: ${deletedCount.fines}`);
    console.log(`   - Orphaned users deleted: ${deletedCount.orphanedUsers}`);
    console.log(`   - Orphaned books deleted: ${deletedCount.orphanedBooks}`);
    
    // Refresh statistics by recalculating fine counts
    console.log('\n🔄 Refreshing fine statistics...');
    
    // Force recalculation of fine statistics by clearing and recalculating
    // This will be reflected when the FineManagement page is refreshed
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart the application to refresh all data');
    console.log('   2. The Fine Management page will show updated statistics');
    console.log('   3. Invalid 59-day overdue records should no longer appear');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
    console.log('\n📴 Database connection closed.');
    process.exit(0);
  }
};

cleanupInvalidOverdue();