const Feedback = require("../models/Feedback");

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { feedbackText, rating } = req.body;

    if (!feedbackText || !rating) {
      return res.status(400).json({ message: "Feedback text and rating are required" });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      feedbackText,
      rating,
    });

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (err) {
    res.status(500).json({ message: "Error submitting feedback", error: err.message });
  }
};

// Get feedback (already implemented)
exports.getFeedback = async (req, res) => {
  const { programId, coachId } = req.query;

  try {
    const filters = {};
    if (programId) filters.programId = programId;
    if (coachId) filters.coachId = coachId;

    const feedback = await Feedback.find(filters);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Failed to get feedback", error: err.message });
  }
};
