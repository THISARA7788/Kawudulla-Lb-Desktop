// =========================================================================
// WHAT DOES THIS FILE DO?
// This middleware handles backend security. It signs JWT tokens for logins,
// decodes and validates tokens to secure protected API routes (protect),
// checks user accounts statuses, and guards routes against unauthorized access
// using role-based filters (e.g., student vs. teacher vs. librarian).
// =========================================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwtsecret123', { expiresIn: '7d' });
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret123');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Check if user has specific role
 * Rejects login if user's role doesn't match or account is not active
 */
const checkRole = (allowedRole) => {
  return async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check if user's role matches this route
      if (user.role !== allowedRole) {
        return res.status(403).json({
          message: `Access denied. This login is for ${allowedRole} only.`,
        });
      }

      // Check if account is approved
      if (user.status !== 'active') {
        return res.status(403).json({
          message: `Your account is ${user.status}. Please wait for librarian approval.`,
        });
      }

      // Attach user to request
      req.user = user;
      req.token = generateToken(user._id);
      next();
    } catch (error) {
      console.error('Check role error:', error.message);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

/**
 * Restrict access based on role (for protected routes)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Only ${allowedRoles.join(', ')} can access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, checkRole };
