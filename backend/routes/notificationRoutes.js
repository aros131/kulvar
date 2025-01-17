const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Bildirimleri getir
router.get('/', authMiddleware, notificationController.getNotifications);

module.exports = router;
