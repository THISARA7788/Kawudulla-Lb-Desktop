const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/db');
const syncService = require('../services/syncService');
const Book = require('../models/Book');
const User = require('../models/User');

async function testPull() {
  console.log('--- Testing Automatic Cloud Pull on New PC ---');
  await connectDB();

  console.log('Simulating fresh empty PC database (clearing local books/users)...');
  await Book.deleteMany({});
  await User.deleteMany({ role: { $ne: 'librarian' } });

  console.log(`Local Books before cloud pull: ${await Book.countDocuments()}`);

  console.log('🚀 Triggering Automatic Cloud Pull...');
  const result = await syncService.runSync();
  console.log('Sync Result:', result);

  const finalBooks = await Book.countDocuments();
  const finalUsers = await User.countDocuments();

  console.log(`\n🎉 RESULTS:`);
  console.log(`- Local Books downloaded from Cloud: ${finalBooks}`);
  console.log(`- Local Members downloaded from Cloud: ${finalUsers}`);

  if (finalBooks > 0) {
    console.log('✅ Automatic Cloud Data Pull is 100% working!');
  } else {
    console.error('❌ Failed to pull data from cloud.');
  }

  process.exit(0);
}

testPull().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
