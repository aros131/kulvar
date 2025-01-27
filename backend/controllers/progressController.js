const Progress = require("../models/Progress");

exports.logProgress = async (req, res) => {
  try {
    const { programId, details } = req.body;
    const progress = await Progress.create({
      userId: req.user.id,
      programId,
      details,
    });
    res.status(201).json({ message: "Progress logged successfully", data: progress });
  } catch (error) {
    res.status(500).json({ message: "Error logging progress", error: error.message });
  }
};

exports.getClientProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.params.id });
    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving progress", error: error.message });
  }
};

exports.getProgressReport = async (req, res) => {
  try {
    const report = await Progress.find({ userId: req.params.id }).populate("programId");
    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: "Error generating progress report", error: error.message });
  }
};
