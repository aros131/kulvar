import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getProfile, updateProfile, completeOnboarding, updateNotificationPreferences, uploadAvatar } from '../controllers/profileController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);
router.patch("/onboarding-complete", protect, completeOnboarding);
router.patch("/notification-preferences", protect, updateNotificationPreferences);

export default router;
