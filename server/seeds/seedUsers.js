/**
 * =============================================
 * SEED SCRIPT - Create 3 main users in MongoDB
 * =============================================
 *
 * Run this once to create the default users:
 *   node seeds/seedUsers.js
 *
 * Default users created:
 *   - Librarian  (full access)  → email: librarian@kmv.edu
 *   - Teacher    (medium access) → email: teacher@kmv.edu
 *   - Student    (basic access) → email: student@kmv.edu
 *
 * All passwords are: password123
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const mainUsers = [
  {
    name: 'School Librarian',
    email: 'librarian@kmv.edu',
    password: 'password123',
    role: 'librarian',
    grade: '',
    status: 'active',
  },
  {
    name: 'School Teacher',
    email: 'teacher@kmv.edu',
    password: 'password123',
    role: 'teacher',
    grade: '',
    status: 'active',
  },
  {
    name: 'Student User',
    email: 'student@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '10A',
    status: 'active',
  },
];

const seedUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    for (const userData of mainUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`️  User "${userData.role}" already exists. Skipping.`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`✅ Created ${userData.role.padEnd(10)} → ${userData.email}`);
    }

    console.log('\n✅ Seeding completed!');
    console.log('\n📋 Login credentials:');
    console.log('  Librarian: librarian@kmv.edu / password123');
    console.log('  Teacher:   teacher@kmv.edu   / password123');
    console.log('  Student:   student@kmv.edu   / password123');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n📴 Database connection closed.');
    process.exit(0);
  }
};

seedUsers();
