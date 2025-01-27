const express = require("express");
const router = express.Router();
const { register, login, getUserProfile } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

router.post("/register", register); // Register users and coaches
router.post("/login", login); // Login users and coaches
router.get("/profile", protect, getUserProfile); // Get user profile (protected)

module.exports = router;
