const express = require("express");
const { login, register, getUserProfile } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware"); // Ensure correct path
console.log({ protect }); // Debugging
const router = express.Router();

// POST /auth/register: Register a user
router.post("/register", register);

// POST /auth/login: Log in a user
router.post("/login", login);

// GET /auth/profile: Get user profile (protected)
router.get("/profile", protect, getUserProfile);

module.exports = router;
