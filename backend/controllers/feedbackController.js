const Feedback = require("../models/Feedback");
exports.createFeedback = async (req, res) => {
  try {
      const { content, coachId } = req.body;
      const feedback = await Feedback.create({
          content,
          coachId,
          userId: req.user.id,
      });
      res.status(201).json(feedback);
  } catch (error) {
      res.status(500).json({ message: "Error creating feedback", error: error.message });
  }
};


// Get feedback (already implemented)
exports.getFeedbacks = async (req, res) => {
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
