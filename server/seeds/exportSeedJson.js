const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const CLOUD_URI = process.env.CLOUD_MONGODB_URI || 'mongodb+srv://KaudullaLB:LB123@cluster0.ubtr0ci.mongodb.net/kawudulla_school_db_real?retryWrites=true&w=majority';

async function exportJson() {
  console.log('Connecting to database to export seed JSON...');
  const conn = await mongoose.createConnection(CLOUD_URI, {
    serverSelectionTimeoutMS: 5000,
  }).asPromise();

  const collections = ['users', 'books', 'transactions', 'fines', 'fineconfigs', 'bookcounters'];
  const snapshot = {};

  for (const collName of collections) {
    const docs = await conn.collection(collName).find({}).toArray();
    snapshot[collName] = docs;
    console.log(`Exported ${docs.length} records from ${collName}`);
  }

  const outputPath = path.join(__dirname, 'initial_library_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`✅ Saved complete snapshot to: ${outputPath}`);

  await conn.close();
  process.exit(0);
}

exportJson().catch(err => {
  console.error('Export error:', err);
  process.exit(1);
});
