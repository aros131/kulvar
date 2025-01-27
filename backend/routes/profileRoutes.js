const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/profileController");

router.get("/", protect, getProfile); // Fetch profile for logged-in user
router.put("/", protect, updateProfile); // Update profile information

module.exports = router;
