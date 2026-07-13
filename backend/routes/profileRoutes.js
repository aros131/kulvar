import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getProfile, updateProfile, completeOnboarding, updateNotificationPreferences } from '../controllers/profileController.js';

router.get("/", protect, getProfile); // Fetch profile for logged-in user
router.put("/", protect, updateProfile); // Update profile information
router.patch("/onboarding-complete", protect, completeOnboarding);
router.patch("/notification-preferences", protect, updateNotificationPreferences);

export default router;
