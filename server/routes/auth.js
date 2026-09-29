const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect, authorize, checkRole } = require('../middleware/auth');

// ------------------------------------------
// Configure email transporter (Gmail / Mailtrap SMTP)
// ------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT) || 2525,
  secure: parseInt(process.env.EMAIL_PORT) === 465, // true for port 465 SSL, false for other ports (TLS/unsecured)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ------------------------------------------
// POST /api/auth/register
// Anyone can register (default role: student)
// New registrations are set to 'pending' status
// ------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, grade, class: classSection, stream } = req.body;

    // Validate role
    const validRoles = ['student', 'teacher', 'librarian'];
    const userRole = role || 'student';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be: student, teacher, or librarian' });
    }

    // Prevent self-registration of librarian accounts
    if (userRole === 'librarian') {
      return res.status(403).json({ message: 'Librarian accounts cannot be created through registration. Contact system administrator.' });
    }

    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      if (userExists.status === 'rejected') {
        await User.deleteOne({ _id: userExists._id });
      } else {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    }

    // Unified password validation on the server layer for all registrations (students, teachers, etc.)
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, numeric, and special characters' });
    }

    const user = await User.create({
      name,
      email: sanitizedEmail,
      password,
      role: userRole,
      grade: grade || '',
      class: classSection || '',
      stream: stream || '',
      status: 'pending', // New users start as pending
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: await generateToken(user._id),
      message: 'Registration successful! Your account is pending librarian approval.',
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ------------------------------------------
// POST /api/auth/login
// Unified login: Automatically identifies the user's role and logs them in
// ------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: `Your account is ${user.status}. Please wait for librarian approval.`,
      });
    }

    const token = await generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error('Unified login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ------------------------------------------
// POST /api/auth/login/student
// Only student accounts can login
// ------------------------------------------
router.post('/login/student', checkRole('student'), (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    token: req.token,
  });
});

// ------------------------------------------
// POST /api/auth/login/teacher
// Only teacher accounts can login
// ------------------------------------------
router.post('/login/teacher', checkRole('teacher'), (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    token: req.token,
  });
});

// ------------------------------------------
// POST /api/auth/login/librarian
// Only librarian accounts can login
// ------------------------------------------
router.post('/login/librarian', checkRole('librarian'), (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    token: req.token,
  });
});

// ------------------------------------------
// GET /api/auth/me
// Get current authenticated user profile
// ------------------------------------------
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------
// PUT /api/auth/me
// Update current authenticated user profile
// ------------------------------------------
router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: req.body.name || undefined, grade: req.body.grade || '' },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update profile' });
  }
});

// ------------------------------------------
// POST /api/auth/forgot-password
// Send reset email
// ------------------------------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log(`Forgot password requested for email: "${sanitizedEmail}"`);

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 300000; // 5 minutes expiration
    await user.save();

    console.log(`Sending recovery OTP code "${otp}" to "${user.email}"`);

    await transporter.sendMail({
      from: `"School Library System" <${process.env.EMAIL_USER || 'no-reply@library.com'}>`,
      to: user.email,
      subject: 'Password Reset Verification Code',
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#1a2744;text-align:center;">Password Reset Verification</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested a password reset. Please use the following One-Time Password (OTP) to verify your request:</p>
        <div style="text-align:center;margin:30px 0;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f8fafc;padding:12px 24px;border:1px dashed #cbd5e1;border-radius:8px;color:#1e293b;">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center;">This OTP code is valid for 5 minutes only. If you did not make this request, please ignore this email.</p>
      </div>`,
    });

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Failed to send reset verification email' });
  }
});

// ------------------------------------------
// POST /api/auth/verify-otp
// Verify 6-digit recovery OTP
// ------------------------------------------
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP verification code are required' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: sanitizedEmail,
      resetOTP: otp.trim(),
      resetOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    res.json({ success: true, message: 'Verification code verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// ------------------------------------------
// POST /api/auth/reset-password-otp
// Reset password using OTP code verification
// ------------------------------------------
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: sanitizedEmail,
      resetOTP: otp.trim(),
      resetOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Session expired. Please request a new OTP code.' });
    }

    // Unified password validation rules
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, numbers, and special symbols' });
    }

    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password OTP error:', error.message);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ------------------------------------------
// POST /api/auth/reset-password
// Reset password using token
// ------------------------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ------------------------------------------
// Helper: generate JWT
// ------------------------------------------
const jwt = require('jsonwebtoken');

async function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwtsecret123', { expiresIn: '7d' });
}

// ===========================
// PENDING REGISTRATION ROUTES (Librarian Only)
// ===========================

// GET /api/auth/pending - Librarians view all pending registrations
router.get('/pending', protect, authorize('librarian'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending', role: { $ne: 'librarian' } })
      .select('-password -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 });

    res.json({ users: pendingUsers, count: pendingUsers.length });
  } catch (error) {
    console.error('Get pending users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/approve/:id - Librarian approves a pending user
router.put('/approve/:id', protect, authorize('librarian'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        message: `User is already ${user.status}. Cannot approve.`,
      });
    }

    user.status = 'active';
    user.rejectionReason = '';
    await user.save();

    // Send notification
    const { createNotification } = require('../utils/notificationsHelper');
    await createNotification({
      recipient: user._id,
      type: 'registration_approved',
      message: `Your registration has been approved by ${req.user.name}. You can now login.`,
    });

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password -resetToken -resetTokenExpiry');

    res.json({
      message: `User ${user.name} approved successfully`,
      user: userResponse,
    });
  } catch (error) {
    console.error('Approve user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/reject/:id - Librarian rejects a pending user
router.put('/reject/:id', protect, authorize('librarian'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        message: `User is already ${user.status}. Cannot reject.`,
      });
    }

    user.status = 'rejected';
    user.rejectionReason = reason || 'Application rejected';
    await user.save();

    // Send notification
    const { createNotification } = require('../utils/notificationsHelper');
    await createNotification({
      recipient: user._id,
      type: 'registration_rejected',
      message: `Your registration was rejected. Reason: ${reason || 'Application rejected'}`,
    });

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password -resetToken -resetTokenExpiry');

    res.json({
      message: `User ${user.name} rejected`,
      user: userResponse,
    });
  } catch (error) {
    console.error('Reject user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------
// PUT /api/auth/change-password
// Change password using current password
// ------------------------------------------
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain uppercase, lowercase, numeric, and special characters' });
    }

    // Fetch user including password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // User model pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
