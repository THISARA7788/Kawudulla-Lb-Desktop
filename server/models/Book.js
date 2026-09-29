// =========================================================================
// WHAT DOES THIS FILE DO?
// This file defines the Mongoose Database Schema for Book catalog items.
// It stores details like titles, authors, categories, ISBNs, copy tracking stats,
// and automatically assigns a catalog sequence ID (like BK0001) for search lookups.
// =========================================================================

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const BookCounter = mongoose.models.BookCounter || mongoose.model('BookCounter', counterSchema);

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a book title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please provide the author name'],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
    },
    availableCopies: {
      type: Number,
      default: 1,
    },
    publisher: {
      type: String,
      default: '',
    },
    publishedYear: {
      type: Number,
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Available', 'Borrowed', 'Reserved'],
      default: 'Available',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ category: 1 });
bookSchema.index({ isDeleted: 1 });

// Auto-generate bookId on new book creation
bookSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookId) {
    const counter = await BookCounter.findByIdAndUpdate(
      'bookId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.bookId = `BK${String(counter.seq).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
