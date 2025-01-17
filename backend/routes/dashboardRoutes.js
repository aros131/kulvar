const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Koç için rotalar
router.get('/programs', authMiddleware, roleMiddleware('coach'), dashboardController.getPrograms);
router.get('/clients', authMiddleware, roleMiddleware('coach'), dashboardController.getClients);
router.get('/analytics', authMiddleware, roleMiddleware('coach'), dashboardController.getAnalytics);

// Kullanıcı için rotalar
router.get('/user-programs', authMiddleware, roleMiddleware('user'), dashboardController.getUserPrograms);
router.post('/progress', authMiddleware, roleMiddleware('user'), dashboardController.saveProgress);

module.exports = router;
