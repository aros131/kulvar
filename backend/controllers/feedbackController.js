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
