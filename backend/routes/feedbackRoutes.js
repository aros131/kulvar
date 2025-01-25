const express = require("express");
const { submitFeedback, getFeedback } = require("../controllers/feedbackController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /feedback: Submit feedback
router.post("/", protect, submitFeedback);

// GET /feedback: Get all feedback (optional)
router.get("/", protect, getFeedback);

module.exports = router;
