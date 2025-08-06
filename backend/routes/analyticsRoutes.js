import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getAnalytics } from '../controllers/analyticsController.js';

router.get("/", protect, getAnalytics);

export default router;
