const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide the book title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please provide the book author'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
    },
    librarianNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BookRequest', bookRequestSchema);
