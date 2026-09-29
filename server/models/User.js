// =========================================================================
// WHAT DOES THIS FILE DO?
// This file defines the Mongoose Database Schema for User accounts.
// It stores names, roles (student/teacher/librarian), status, and hashes
// passwords using bcrypt on pre-save hooks. It also manages database counters
// to automatically generate unique Member IDs (like KMV-0001) for library cards.
// =========================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const UserCounter = mongoose.models.UserCounter || mongoose.model('UserCounter', userCounterSchema);

const userSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      sparse: true,
    },
    grade: {
      type: String,
      trim: true,
    },
    class: {
      type: String,
      trim: true,
    },
    stream: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
    },
    // User role: student, teacher, or librarian
    role: {
      type: String,
      enum: ['student', 'teacher', 'librarian'],
      required: [true, 'Please select a role'],
      default: 'student',
    },
    // Registration status: pending | active | rejected
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'pending',
    },
    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      default: '',
    },
    // Fields for password reset
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    resetOTP: {
      type: String,
      default: null,
    },
    resetOTPExpiry: {
      type: Date,
      default: null,
    },
    // Borrowed books tracking
    borrowedBooks: [{
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      borrowDate: {
        type: Date,
        default: Date.now,
      },
      dueDate: {
        type: Date,
      },
      returnDate: {
        type: Date,
        default: null,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Auto-generate memberId on new user creation
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.memberId) {
    const counter = await UserCounter.findByIdAndUpdate(
      'memberId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.memberId = `KMV-${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
