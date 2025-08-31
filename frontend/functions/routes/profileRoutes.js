import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';

router.get("/", protect, getProfile); // Fetch profile for logged-in user
router.put("/", protect, updateProfile); // Update profile information

export default router;
