const Progress = require("../models/Progress");
const Program = require("../models/Program");

// 🟢 Log user progress
const logProgress = async (req, res) => {
  try {
    const { programId, sessionName, fatigueLevel, weightUsed, repsCompleted } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, sessionTracking: [] });
    }

    progress.sessionTracking.push({ sessionName, fatigueLevel, weightUsed, repsCompleted, date: new Date() });

    await progress.save();
    res.status(201).json({ message: "Progress logged successfully", progress });
  } catch (error) {
    res.status(500).json({ message: "Error logging progress", error: error.message });
  }
};

// 🟢 Get progress for all clients (Coach Only)
const getClientProgress = async (req, res) => {
  try {
    const clientsProgress = await Progress.find().populate("userId", "name email");
    res.status(200).json({ clientsProgress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching client progress", error: error.message });
  }
};

// 🟢 Get detailed progress report for a client
const getProgressReport = async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await Progress.findById(id).populate("userId", "name email");

    if (!progress) return res.status(404).json({ message: "Progress not found" });

    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress report", error: error.message });
  }
};

// 🟢 Mark a workout as completed
const markWorkoutCompleted = async (req, res) => {
  try {
    const { programId, sessionName } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, completedSessions: [] });
    }

    if (!progress.completedSessions.includes(sessionName)) {
      progress.completedSessions.push(sessionName);
    }

    await progress.save();
    res.status(200).json({ message: "Workout marked as completed", progress });
  } catch (error) {
    res.status(500).json({ message: "Error marking workout as completed", error: error.message });
  }
};

// 🟢 Reschedule a missed workout
const rescheduleWorkout = async (req, res) => {
  try {
    const { programId, missedDay, newDay } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) return res.status(404).json({ message: "No progress found" });

    progress.missedWorkouts.push({ missedDay, rescheduledTo: newDay });

    await progress.save();
    res.status(200).json({ message: `Missed workout rescheduled to ${newDay}`, progress });
  } catch (error) {
    res.status(500).json({ message: "Error rescheduling workout", error: error.message });
  }
};

// 🟢 Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { programId, session, feedback } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOneAndUpdate(
      { programId, userId },
      { $push: { feedback: { session, feedback, date: new Date() } } },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: "Feedback submitted successfully", progress });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

// 🟢 Restart a program
const restartProgram = async (req, res) => {
  try {
    const { programId } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) return res.status(404).json({ message: "Progress not found" });

    progress.completedSessions = [];
    progress.sessionTracking = [];

    await progress.save();
    res.status(200).json({ message: "Program successfully restarted", progress });
  } catch (error) {
    res.status(500).json({ message: "Error restarting program", error: error.message });
  }
};

// 🟢 Get user workout streaks
const getUserStreaks = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await Progress.find({ userId });

    let maxStreak = 0;
    let currentStreak = 0;

    progress.forEach(prog => {
      prog.sessionTracking.forEach(session => {
        if (session.completed) {
          currentStreak += 1;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      });
    });

    res.status(200).json({ maxStreak, currentStreak });
  } catch (error) {
    res.status(500).json({ message: "Error fetching streaks", error: error.message });
  }
};

// 🟢 Fetch adaptive goal progress
const getAdaptiveGoalProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await Progress.find({ userId });

    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving goal progress", error: error.message });
  }
};

// 🟢 Get strength progress
const getStrengthProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      return res.status(404).json({ message: "Strength progress not found." });
    }

    res.status(200).json({
      strength: progress.progressiveOverload.map(entry => ({
        exerciseName: entry.exerciseName,
        currentWeight: entry.currentWeight,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching strength progress", error: error.message });
  }
};
// 🟢 Get user progress for a specific program
const getUserProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      return res.status(404).json({ message: "No progress found for this program." });
    }

    // ✅ Calculate progress percentage
    const totalSessions = progress.sessionTracking.length;
    const completedSessions = progress.sessionTracking.filter(s => s.completed).length;
    const progressPercentage = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(2) : 0;

    res.status(200).json({
      progressPercentage,
      completedSessions,
      totalSessions,
      streakTracking: progress.streakTracking,
      achievementBadges: progress.achievementBadges,
      goalTracking: progress.goalTracking,
      missedWorkouts: progress.missedWorkouts,
      strengthProgress: progress.progressiveOverload.map(entry => ({
        exerciseName: entry.exerciseName,
        currentWeight: entry.currentWeight,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error: error.message });
  }
};


// 🟢 Fetch progress trend over time
const getProgressTrend = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({ programId, userId });

    if (!progress || !progress.trendData) {
      return res.status(404).json({ message: "No progress data found." });
    }

    res.status(200).json({ progress: progress.trendData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress trend", error: error.message });
  }
};

// 🟢 Mark a session as completed
const markSessionCompleted = async (req, res) => {
  try {
    const { programId, sessionName, fatigueLevel } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, sessionTracking: [] });
    }

    // ✅ Check if the session is already completed
    const session = progress.sessionTracking.find(s => s.sessionName === sessionName);
    if (session && session.completed) {
      return res.status(400).json({ message: "Session already completed." });
    }

    // ✅ Mark session as completed
    if (session) {
      session.completed = true;
      session.fatigueLevel = fatigueLevel || "Normal";
      session.dateCompleted = new Date();
    } else {
      progress.sessionTracking.push({ sessionName, completed: true, fatigueLevel, dateCompleted: new Date() });
    }

    // ✅ Update streak tracking
    progress.streakTracking.currentStreak += 1;
    if (progress.streakTracking.currentStreak > progress.streakTracking.longestStreak) {
      progress.streakTracking.longestStreak = progress.streakTracking.currentStreak;
    }

    // ✅ Recalculate progress percentage
    const completedSessions = progress.sessionTracking.filter(s => s.completed).length;
    const totalSessions = progress.sessionTracking.length;
    progress.progressPercentage = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(2) : 0;

    await progress.save();

    res.status(200).json({
      message: "Session completed successfully!",
      progressPercentage: progress.progressPercentage,
      completedSessions,
      totalSessions,
      streakTracking: progress.streakTracking,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking session as completed", error: error.message });
  }
};


// 🟢 Update user goal progress
const updateGoalProgress = async (req, res) => {
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
// 🟢 Get progress percentages for all assigned programs
const getAllProgramProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all assigned programs for this user
    const assignedPrograms = await Program.find({ assignedClients: userId });

    // For each program, get its progress
    const programProgress = await Promise.all(assignedPrograms.map(async (program) => {
      const progress = await Progress.findOne({ programId: program._id, userId });
      const percentage = progress ? progress.progressPercentage : 0;

      return {
        programId: program._id,
        name: program.name,
        description: program.description,
        duration: program.duration,
        progressPercentage: percentage,
      };
    }));

    res.status(200).json({ programProgress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching program progress", error: error.message });
  }
};



// ✅ Export all functions
module.exports = {
  logProgress,
  getClientProgress,
  getProgressReport,
  markWorkoutCompleted,
  rescheduleWorkout,
  submitFeedback,
  restartProgram,
  getUserStreaks,
  getAdaptiveGoalProgress,
  getStrengthProgress,
  getUserProgress,
  getProgressTrend,
  markSessionCompleted,
  updateGoalProgress,
  getAllProgramProgress,
};
