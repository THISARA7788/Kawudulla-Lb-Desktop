const express = require('express');
const router = express.Router();
const syncService = require('../services/syncService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/sync/status
// @desc    Get current cloud connection and backup status
// @access  Public / Protected
router.get('/status', (req, res) => {
  res.json(syncService.getStatus());
});

// @route   POST /api/sync/backup
// @desc    Manually push local database to MongoDB Cloud Atlas
// @access  Private (Librarian)
router.post('/backup', protect, authorize('librarian'), async (req, res) => {
  try {
    const result = await syncService.runBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message, status: 'error' });
  }
});

// @route   POST /api/sync/trigger
// @desc    Legacy alias for trigger backup
// @access  Private (Librarian)
router.post('/trigger', protect, authorize('librarian'), async (req, res) => {
  try {
    const result = await syncService.runBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message, status: 'error' });
  }
});

// @route   POST /api/sync/restore
// @desc    Disaster Recovery: Pull all records from Cloud Atlas to Local Hard Drive
// @access  Private (Librarian)
router.post('/restore', protect, authorize('librarian'), async (req, res) => {
  try {
    const result = await syncService.restoreFromCloud();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message, status: 'error' });
  }
});

module.exports = router;
