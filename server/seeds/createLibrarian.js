/**
 * Seed script: Create an active librarian account
 *
 * Usage: node seeds/createLibrarian.js
 *
 * This creates a librarian that can immediately log in.
 * Email: librarian@school.edu
 * Password: Admin123!
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const connectDB = require('../config/db');

const librarianData = {
  name: 'Admin Librarian',
  email: 'librarian@school.edu',
  password: 'Admin123',
  role: 'librarian',
  grade: '',
  status: 'active',
};

const connectAndSeed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if librarian already exists — delete if exists (to fix double-hash issues)
    const existing = await User.findOne({ email: librarianData.email });
    if (existing) {
      console.log(`⚠️  Found existing librarian with same email. Removing to recreate with correct hash...`);
      await User.deleteOne({ email: librarianData.email });
    }

    // Create admin user — User model's pre-save hook will hash the password automatically
    const user = await User.create({
      name: librarianData.name,
      email: librarianData.email,
      password: librarianData.password,  // plain text — model hashes it on save
      role: librarianData.role,
      grade: librarianData.grade,
      status: librarianData.status,      // explicitly set to 'active'
    });

    console.log('✅ Librarian account created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email:    ${librarianData.email}`);
    console.log(`  Password: ${librarianData.password}`);
    console.log(`  Role:     ${librarianData.role}`);
    console.log(`  Member ID: ${user.memberId}`);
    console.log('');
    console.log('🔐 You can now log in to the system as a librarian.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding librarian:', error.message);
    process.exit(1);
  }
};

connectAndSeed();
