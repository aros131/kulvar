const express = require("express");
const protect = require("../middleware/authMiddleware");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/", protect, profileController.getProfile);

module.exports = router;
