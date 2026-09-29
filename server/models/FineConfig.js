const mongoose = require('mongoose');

const fineConfigSchema = new mongoose.Schema(
  {
    fineRatePerDay: {
      type: Number,
      default: 10,
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FineConfig', fineConfigSchema);
