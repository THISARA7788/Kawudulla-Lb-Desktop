const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    fineId: {
      type: String,
      unique: true,
      sparse: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
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
    amount: {
      type: Number,
      required: true,
    },
    daysOverdue: {
      type: Number,
      required: true,
    },
    ratePerDay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'waived'],
      default: 'unpaid',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    waivedReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const fineCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const FineCounter =
  mongoose.models.FineCounter ||
  mongoose.model('FineCounter', fineCounterSchema);

// Auto-generate sequential Fine ID on creation (e.g., F-0001)
fineSchema.pre('save', async function (next) {
  if (this.isNew && !this.fineId) {
    try {
      let counter = await FineCounter.findById('fineId');
      if (!counter) {
        let maxExisting = 0;
        const allFines = await this.constructor.find({ fineId: /^F-\d+$/ }).select('fineId');
        for (const f of allFines) {
          const num = parseInt(f.fineId.replace('F-', ''), 10);
          if (!isNaN(num) && num > maxExisting) {
            maxExisting = num;
          }
        }
        counter = await FineCounter.findByIdAndUpdate(
          'fineId',
          { seq: maxExisting + 1 },
          { new: true, upsert: true }
        );
      } else {
        counter = await FineCounter.findByIdAndUpdate(
          'fineId',
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
      }

      let candidateId = `F-${String(counter.seq).padStart(4, '0')}`;
      let exists = await this.constructor.findOne({ fineId: candidateId });
      while (exists) {
        counter = await FineCounter.findByIdAndUpdate(
          'fineId',
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        candidateId = `F-${String(counter.seq).padStart(4, '0')}`;
        exists = await this.constructor.findOne({ fineId: candidateId });
      }

      this.fineId = candidateId;
    } catch (err) {
      console.error('Error generating fine sequence:', err);
      const fallbackSeq = Date.now().toString(36).toUpperCase();
      this.fineId = `F-${fallbackSeq}`;
    }
  }
  next();
});

module.exports = mongoose.model('Fine', fineSchema);
