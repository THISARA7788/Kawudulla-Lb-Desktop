const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');

async function test() {
  console.log('--- Testing Local Hard Drive Database Connection ---');
  await connectDB();

  const usersCount = await User.countDocuments();
  console.log(`Total Users in Local DB: ${usersCount}`);

  const booksCount = await Book.countDocuments();
  console.log(`Total Books in Local DB: ${booksCount}`);

  const admin = await User.findOne({ role: 'librarian' });
  if (admin) {
    console.log(`Admin account verified: ${admin.email}`);
  }

  console.log('✅ Local Database test successful!');
  process.exit(0);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
