/**
 * Migration script: Set status="active" for all existing users
 *
 * This updates any users created BEFORE the status field was added.
 * They'll be marked as active so they can continue to log in.
 *
 * Usage: node seeds/migrateUserStatus.js
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const migrate = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check if any users exist without status field
    const usersWithoutStatus = await User.find({ status: { $exists: false } });
    console.log(`📊 Found ${usersWithoutStatus.length} users without status field`);

    if (usersWithoutStatus.length > 0) {
      const result = await User.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'active' } }
      );
      console.log(`✅ Updated ${result.modifiedCount} users to status='active'`);
    } else {
      console.log('✅ All users already have status field');
    }

    // Also ensure all users have a valid status
    const invalidStatusUsers = await User.find({
      status: { $nin: ['pending', 'active', 'rejected'] }
    });
    if (invalidStatusUsers.length > 0) {
      console.log(`⚠️  Found ${invalidStatusUsers.length} users with invalid status, fixing...`);
      await User.updateMany(
        { status: { $nin: ['pending', 'active', 'rejected'] } },
        { $set: { status: 'active' } }
      );
    }

    // Show all users and their statuses
    const allUsers = await User.find().select('name email role status memberId');
    console.log('\n📋 All users in database:');
    console.log('-'.repeat(60));
    if (allUsers.length === 0) {
      console.log('  (no users found)');
    } else {
      allUsers.forEach((u) => {
        console.log(`  [${(u.status || 'null').toUpperCase().padEnd(8)}] ${u.name.padEnd(20)} (${u.role.padEnd(8)}) - ${u.email}  ID: ${u.memberId}`);
      });
    }

    console.log('\n✅ Migration complete!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Stack:', error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

migrate();
