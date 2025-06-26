const express = require("express");
const router = express.Router();
const { register, login, getUserProfile, getUserProfileById } = require("../controllers/authController");
const User = require('../models/User');
const protect = require("../middleware/authMiddleware");

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
module.exports = router;
