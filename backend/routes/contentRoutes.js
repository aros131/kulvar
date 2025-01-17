const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const contentController = require('../controllers/contentController');

// İçerik yükle
router.post('/', authMiddleware, roleMiddleware('coach'), contentController.uploadContent);

// İçerikleri getir
router.get('/', authMiddleware, roleMiddleware('coach'), contentController.getContents);

module.exports = router;
