import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { createFeedback, getFeedbacks } from '../controllers/feedbackController.js';

router.post("/", protect, createFeedback); // Submit feedback
router.get("/", protect, getFeedbacks); // Fetch all feedback for the coach

export default router;
