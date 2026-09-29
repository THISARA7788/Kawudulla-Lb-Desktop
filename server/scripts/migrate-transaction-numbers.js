const dns = require('dns');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root or current dir
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const Transaction = require('../models/Transaction');

const transactionCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const TransactionCounter =
  mongoose.models.TransactionCounter ||
  mongoose.model('TransactionCounter', transactionCounterSchema);

async function migrateTransactionNumbers() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Fetch all transactions sorted chronologically
    const transactions = await Transaction.find({}).sort({ createdAt: 1, issueDate: 1 });
    console.log(`Found ${transactions.length} transactions to update.`);

    let count = 0;
    for (const tx of transactions) {
      count++;
      const newTxnNumber = `TRN-${String(count).padStart(4, '0')}`;
      const oldId = tx.transactionId;
      
      tx.transactionId = newTxnNumber;
      await tx.save();
      console.log(`Updated transaction ${tx._id}: ${oldId || '(none)'} -> ${newTxnNumber}`);
    }

    // Set the counter sequence to the total count
    await TransactionCounter.findByIdAndUpdate(
      'transactionId',
      { seq: count },
      { upsert: true }
    );
    console.log(`\n✅ Successfully migrated ${count} transactions.`);
    console.log(`✅ TransactionCounter 'transactionId' set to ${count}.`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateTransactionNumbers();
