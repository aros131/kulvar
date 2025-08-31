import express from 'express';
const router = express.Router();
import { register, login, getUserProfile, getUserProfileById } from '../controllers/authController.js';
import User from '../models/User.js';
import protect from '../middleware/authMiddleware.js';

router.post("/register", register); // Register users and coaches
router.post("/login", login); // Login users and coaches
router.get("/profile", protect, getUserProfile); // Get user profile (protected)
router.get("/:id", protect, getUserProfileById); // Fetch a user by ID
router.get('/users', async (req, res) => {
  const { role } = req.query;
  try {
    const query = role ? { role } : {};
    const users = await User.find(query);
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
export default router;
