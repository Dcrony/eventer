const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeAdmin  } = require('../middleware/adminAccess');

console.log('fraudController:', fraudController);
console.log('requireAdmin:', authorizeAdmin);

// Admin summary
router.get('/admin/summary', authorizeAdmin, fraudController.getAdminSummary);

// Organizer-specific flags (organizer or admin)
router.get('/organizer/:organizerId/flags', authMiddleware, fraudController.getOrganizerFlags);

// Clear flag (admin)
router.post('/flag/:id/clear', authorizeAdmin, fraudController.clearFlag);

module.exports = router;
