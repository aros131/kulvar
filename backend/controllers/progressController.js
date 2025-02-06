const Progress = require("../models/Progress");
const Program = require("../models/Program");

// 🟢 Get user progress for a specific program
exports.getUserProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      return res.status(404).json({ message: "No progress found for this program." });
    }

    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error: error.message });
  }
};

// 🟢 Update progress when a session is completed
exports.trackSessionCompletion = async (req, res) => {
  try {
    const { programId, session } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, completedSessions: [] });
    }

    if (!progress.completedSessions.includes(session)) {
      progress.completedSessions.push(session);
    }

    await progress.save();

    res.status(200).json({ message: "Session marked as completed", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating progress", error: error.message });
  }
};

// 🟢 Reset user progress for a specific program
exports.resetProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOneAndUpdate(
      { programId, userId },
      { completedSessions: [] },
      { new: true }
    );

    if (!progress) {
      return res.status(404).json({ message: "No progress found to reset." });
    }

    res.status(200).json({ message: "Progress reset successfully", progress });
  } catch (error) {
    res.status(500).json({ message: "Error resetting progress", error: error.message });
  }
};

// 🟢 Fetch progress trend over time
exports.getProgressTrend = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      return res.status(404).json({ message: "No progress data found." });
    }

    res.status(200).json({ progress: progress.trendData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress trend", error: error.message });
  }
};

// 🟢 Update fatigue-based adjustments
exports.updateAdaptiveAdjustments = async (req, res) => {
  try {
    const { programId, fatigueLevel, notes } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, fatigueAdjustments: [] });
    }

    progress.fatigueAdjustments.push({ fatigueLevel, notes, date: new Date() });

    await progress.save();

    res.status(200).json({ message: "Fatigue adjustments updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating fatigue adjustments", error: error.message });
  }
};

// 🟢 Update user goal progress
exports.updateGoalProgress = async (req, res) => {
  try {
    const { programId, goalMetric, value } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, goalProgress: {} });
    }

    progress.goalProgress[goalMetric] = value;

    await progress.save();

    res.status(200).json({ message: "Goal progress updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating goal progress", error: error.message });
  }
};

