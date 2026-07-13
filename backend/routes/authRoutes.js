import express from 'express';
const router = express.Router();
import { register, login, getUserProfile, getUserProfileById, changePassword, deleteAccount, adminLogin, forgotPassword, resetPassword } from '../controllers/authController.js';
import User from '../models/User.js';
import { requireUser as protect } from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/admin-login", adminLogin);
router.get("/profile", protect, getUserProfile);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);
router.get("/:id", protect, getUserProfileById);
// Admin-only: lists all users/coaches for the admin dashboard. Previously had no
// auth check at all, leaking every user's name/email to unauthenticated callers.
router.get('/users', protect, roleMiddleware(["admin"]), async (req, res) => {
  const { role } = req.query;
  try {
    const query = role ? { role } : {};
    const users = await User.find(query).select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
export default router;
