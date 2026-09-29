// =========================================================================
// WHAT DOES THIS FILE DO?
// This file defines the Mongoose Database Schema for Transactions.
// It logs book issues (checkout logs), due dates, actual return logs,
// outstanding overdue day calculations, and statuses (active/returned/overdue).
// =========================================================================

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    overdueDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ status: 1, dueDate: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });

const transactionCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const TransactionCounter =
  mongoose.models.TransactionCounter ||
  mongoose.model('TransactionCounter', transactionCounterSchema);

// Auto-generate sequential Transaction Number on creation (e.g., TRN-0001)
transactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionId) {
    try {
      let counter = await TransactionCounter.findById('transactionId');
      if (!counter) {
        // Find maximum existing TRN in DB to start sequence properly
        let maxExisting = 0;
        const allTxWithTrn = await this.constructor.find({ transactionId: /^TRN-\d+$/ }).select('transactionId');
        for (const tx of allTxWithTrn) {
          const num = parseInt(tx.transactionId.replace('TRN-', ''), 10);
          if (!isNaN(num) && num > maxExisting) {
            maxExisting = num;
          }
        }
        counter = await TransactionCounter.findByIdAndUpdate(
          'transactionId',
          { seq: maxExisting + 1 },
          { new: true, upsert: true }
        );
      } else {
        counter = await TransactionCounter.findByIdAndUpdate(
          'transactionId',
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
      }

      // Check if ID already exists, if so keep incrementing until unique
      let candidateId = `TRN-${String(counter.seq).padStart(4, '0')}`;
      let exists = await this.constructor.findOne({ transactionId: candidateId });
      while (exists) {
        counter = await TransactionCounter.findByIdAndUpdate(
          'transactionId',
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        candidateId = `TRN-${String(counter.seq).padStart(4, '0')}`;
        exists = await this.constructor.findOne({ transactionId: candidateId });
      }

      this.transactionId = candidateId;
    } catch (err) {
      console.error('Error generating transaction sequence:', err);
      // Fallback in case counter operation fails
      const fallbackSeq = Date.now().toString(36).toUpperCase();
      this.transactionId = `TRN-${fallbackSeq}`;
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
