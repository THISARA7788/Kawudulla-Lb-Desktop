const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Book = require('../models/Book');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const bookIds = ['BK098', 'BK043', 'BK097', 'BK062', 'BK074'];
    const books = await Book.find({ bookId: { $in: bookIds } });
    
    console.log('Book details in Database:');
    for (const b of books) {
      console.log(`- ID: ${b.bookId}`);
      console.log(`  Title: ${b.title}`);
      console.log(`  Title Codepoints:`, b.title.split('').map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

run();
