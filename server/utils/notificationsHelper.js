const Notification = require('../models/Notification');

/**
 * Create a notification for a user.
 * Call this anywhere you want a notification triggered.
 */
async function createNotification({ recipient, type = 'general', message, relatedBook, relatedTransaction }) {
  try {
    return await Notification.create({
      recipient,
      type,
      message,
      relatedBook,
      relatedTransaction,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

module.exports = { createNotification };
