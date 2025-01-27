const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { createFeedback, getFeedbacks } = require("../controllers/feedbackController");

router.post("/", protect, createFeedback); // Submit feedback
router.get("/", protect, getFeedbacks); // Fetch all feedback for the coach

module.exports = router;
