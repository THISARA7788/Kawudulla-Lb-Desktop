const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const BookRequest = require('../models/BookRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @route   GET /api/book-requests/pending-count
// @desc    Get count of pending book requests
// @access  Private
router.get('/pending-count', protect, async (req, res) => {
  try {
    const query = req.user.role === 'librarian'
      ? { status: 'pending' }
      : { user: req.user._id, status: 'pending' };
    const count = await BookRequest.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Pending count error:', error);
    res.status(500).json({ count: 0 });
  }
});

// @route   POST /api/book-requests
// @desc    Submit a new book request / recommendation
// @access  Private (student, teacher, librarian)
router.post('/', protect, async (req, res) => {
  try {
    const { title, author, category, isbn, reason } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required.' });
    }

    const request = await BookRequest.create({
      user: req.user._id,
      title: title.trim(),
      author: author.trim(),
      category: category ? category.trim() : 'General',
      isbn: isbn ? isbn.trim() : '',
      reason: reason ? reason.trim() : '',
      status: 'pending',
    });

    await request.populate('user', 'name role memberId email grade class');

    // Trigger Notification for all active Librarians
    try {
      const librarians = await User.find({ role: 'librarian', status: 'active' }).select('_id');
      const roleLabel = req.user.role === 'teacher' ? 'Teacher' : 'Student';
      const notifications = librarians.map((lib) => ({
        recipient: lib._id,
        type: 'book_requested',
        message: `${roleLabel} ${req.user.name} requested "${title.trim()}" by ${author.trim()}`,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Error creating librarian notification:', notifErr);
    }

    res.status(201).json({ message: 'Book request submitted successfully.', request });
  } catch (error) {
    console.error('Create book request error:', error);
    res.status(500).json({ message: 'Server error submitting book request.' });
  }
});

// @route   GET /api/book-requests/my
// @desc    Get book requests submitted by the logged-in user
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await BookRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my book requests error:', error);
    res.status(500).json({ message: 'Server error retrieving your book requests.' });
  }
});

// @route   GET /api/book-requests
// @desc    Get all book requests (for librarian review)
// @access  Private (Librarian)
router.get('/', protect, authorize('librarian'), async (req, res) => {
  try {
    const requests = await BookRequest.find()
      .populate('user', 'name role memberId email grade class')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get all book requests error:', error);
    res.status(500).json({ message: 'Server error retrieving all book requests.' });
  }
});

// @route   PUT /api/book-requests/:id/status
// @desc    Update book request status
// @access  Private (Librarian)
router.put('/:id/status', protect, authorize('librarian'), async (req, res) => {
  try {
    const { status, librarianNote } = req.body;

    if (!['pending', 'approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const request = await BookRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Book request not found.' });
    }

    request.status = status;
    if (typeof librarianNote === 'string') {
      request.librarianNote = librarianNote.trim();
    }

    await request.save();
    await request.populate('user', 'name role memberId email grade class');

    // Trigger Notification for the requesting user
    try {
      await Notification.create({
        recipient: request.user._id,
        type: status === 'approved' ? 'book_request_approved' : 'book_request_declined',
        message: `Your book request for "${request.title}" was ${status}.`,
      });
    } catch (notifErr) {
      console.error('Error creating user notification:', notifErr);
    }

    res.json({ message: 'Book request updated.', request });
  } catch (error) {
    console.error('Update book request status error:', error);
    res.status(500).json({ message: 'Server error updating request status.' });
  }
});

// @route   DELETE /api/book-requests/:id
// @desc    Delete a book request (owner or librarian)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await BookRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Book request not found.' });
    }

    // Only owner or librarian can delete
    if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'librarian') {
      return res.status(403).json({ message: 'Not authorized to delete this request.' });
    }

    await BookRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book request deleted successfully.' });
  } catch (error) {
    console.error('Delete book request error:', error);
    res.status(500).json({ message: 'Server error deleting book request.' });
  }
});

module.exports = router;
