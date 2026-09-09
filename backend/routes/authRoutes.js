import express from 'express';
const router = express.Router();
import { register, login, getUserProfile, getUserProfileById, changePassword, deleteAccount, adminLogin, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController.js';
import User from '../models/User.js';
import { requireUser as protect } from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { mintFirebaseCustomToken } from '../services/firebaseAdmin.js';

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/admin-login", adminLogin);
router.get("/profile", protect, getUserProfile);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);
// Mints a Firebase Auth custom token for the logged-in user, so the frontend
// can sign into Firebase (chat/Storage) as this same identity instead of
// calling Firestore/Storage unauthenticated.
router.get("/firebase-token", protect, async (req, res) => {
  try {
    const token = await mintFirebaseCustomToken(req.user._id, { role: req.user.role });
    res.status(200).json({ token });
  } catch (err) {
    console.error("Firebase custom token error:", err.message);
    res.status(500).json({ message: "Could not create Firebase token", error: err.message });
  }
});
// Admin-only: lists all users/coaches for the admin dashboard. Must be registered
// before "/:id" — otherwise Express matches "/users" as "/:id" with id="users" and
// this handler is never reached.
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
router.get("/:id", protect, getUserProfileById);
export default router;
