const Feedback = require("../models/Feedback");

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { programId, comments, rating } = req.body;

    const feedback = new Feedback({
      programId,
      userId: req.user.id, // Logged-in user
      coachId: req.body.coachId, // Pass the coach ID with the request
      comments,
      rating,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit feedback.", error: err.message });
  }
};

// Get feedback for a program
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ programId: req.params.programId });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch feedback.", error: err.message });
  }
};
