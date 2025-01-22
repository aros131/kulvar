const express = require("express");
const { submitFeedback, getFeedback } = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /feedback: Submit feedback
router.post("/", protect, submitFeedback);

// GET /feedback/:programId: Fetch feedback for a program
router.get("/:programId", protect, getFeedback);

module.exports = router;
