const dns = require('dns');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const Fine = require('../models/Fine');

const fineCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const FineCounter =
  mongoose.models.FineCounter ||
  mongoose.model('FineCounter', fineCounterSchema);

async function migrateFineIds() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const fines = await Fine.find({}).sort({ createdAt: 1 });
    console.log(`Found ${fines.length} fine records to update.`);

    let count = 0;
    for (const fine of fines) {
      count++;
      const newFineId = `F-${String(count).padStart(4, '0')}`;
      const oldId = fine.fineId;
      fine.fineId = newFineId;
      await fine.save();
      console.log(`Updated fine ${fine._id}: ${oldId || '(none)'} -> ${newFineId}`);
    }

    await FineCounter.findByIdAndUpdate(
      'fineId',
      { seq: count },
      { upsert: true }
    );
    console.log(`\n✅ Successfully migrated ${count} fines to F-XXXX format.`);
    console.log(`✅ FineCounter 'fineId' sequence set to ${count}.`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateFineIds();
