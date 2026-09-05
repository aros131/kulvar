import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getAnalytics } from '../controllers/analyticsController.js';

router.get("/", protect, roleMiddleware(["coach"]), getAnalytics);

export default router;
