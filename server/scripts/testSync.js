const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/db');
const syncService = require('../services/syncService');

async function testSync() {
  console.log('--- Testing Hybrid Local to Cloud Sync ---');
  await connectDB();

  console.log('Testing connection to new cloud database...');
  const reachable = await syncService.checkCloudReachable();
  console.log(`Cloud Reachable: ${reachable ? 'YES ✅' : 'NO ❌'}`);

  if (reachable) {
    const result = await syncService.runSync();
    console.log('Sync Result:', result);
    console.log('🎉 Your new cloud database is synced and ready!');
  } else {
    console.error('Could not reach cloud database. Check credentials or internet.');
  }

  process.exit(0);
}

testSync().catch(err => {
  console.error('Sync test failed:', err);
  process.exit(1);
});
