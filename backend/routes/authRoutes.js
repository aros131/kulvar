const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Kullanıcı Kaydı
router.post('/register', authController.register);

// Kullanıcı Girişi
router.post('/login', authController.login);

// Kullanıcı Bilgileri
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
