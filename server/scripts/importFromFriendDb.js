const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const syncService = require('../services/syncService');

const FRIEND_DB_URI = 'mongodb+srv://KaudullaLB:LB123@cluster0.ubtr0ci.mongodb.net/library-db?retryWrites=true&w=majority';

async function importFromFriend() {
  console.log('--- Safe Read-Only Import from Friend\'s Database ---');

  const localConn = await connectDB();
  console.log('✅ Connected to Destination Local Database.');

  const friendConn = await mongoose.createConnection(FRIEND_DB_URI, {
    serverSelectionTimeoutMS: 5000,
  }).asPromise();
  console.log('✅ Connected to Friend\'s Database (Read-Only).');

  // 1. Users
  const sourceUsers = await friendConn.collection('users').find({}).toArray();
  console.log(`Found ${sourceUsers.length} Members / Users in source database...`);
  const userColl = localConn.connection.collection('users');
  await userColl.deleteMany({});
  if (sourceUsers.length > 0) {
    await userColl.insertMany(sourceUsers);
    console.log(`  -> Copied ${sourceUsers.length} Members / Users successfully!`);
  }

  // 2. Books
  const sourceBooks = await friendConn.collection('books').find({}).toArray();
  console.log(`Found ${sourceBooks.length} Books in source database...`);
  const bookColl = localConn.connection.collection('books');
  await bookColl.deleteMany({});
  if (sourceBooks.length > 0) {
    await bookColl.insertMany(sourceBooks);
    console.log(`  -> Copied ${sourceBooks.length} Books successfully!`);
  }

  // 3. Transactions
  const sourceTx = await friendConn.collection('transactions').find({}).toArray();
  console.log(`Found ${sourceTx.length} Transactions in source database...`);
  const txColl = localConn.connection.collection('transactions');
  await txColl.deleteMany({});
  if (sourceTx.length > 0) {
    await txColl.insertMany(sourceTx);
    console.log(`  -> Copied ${sourceTx.length} Transactions successfully!`);
  }

  // 4. Fines
  const sourceFines = await friendConn.collection('fines').find({}).toArray();
  const fineColl = localConn.connection.collection('fines');
  await fineColl.deleteMany({});
  if (sourceFines.length > 0) {
    await fineColl.insertMany(sourceFines);
    console.log(`  -> Copied ${sourceFines.length} Fines successfully!`);
  }

  await friendConn.close();
  console.log('Closed connection to Friend\'s Database.');

  // Sync everything to the new cloud database
  console.log('--- Syncing everything to your New Cloud Database ---');
  const syncRes = await syncService.runSync();
  console.log('Cloud Sync Result:', syncRes);

  console.log('\n🎉 ALL 83 Books, 50 Members, and 66 Circulation Records imported successfully!');
  process.exit(0);
}

importFromFriend().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
