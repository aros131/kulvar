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

exports.getStrengthProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const progress = await Progress.findOne({ programId });

    if (!progress) {
      return res.status(404).json({ message: "İlerleme verisi bulunamadı" });
    }

    res.status(200).json({ strength: progress.progressiveOverload });
  } catch (error) {
    res.status(500).json({ message: "Güç gelişimi verisi alınamadı", error: error.message });
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
// ✅ Mark Workout as Completed
exports.markWorkoutCompleted = async (req, res) => {
  try {
    const { programId, day } = req.body;
    const clientId = req.user.id;

    let progress = await Progress.findOne({ clientId, programId });
    if (!progress) {
      progress = new Progress({ clientId, programId, completedDays: [] });
    }

    const alreadyCompleted = progress.completedDays.some(d => d.day === day);
    if (!alreadyCompleted) {
      progress.completedDays.push({ day, completed: true, dateCompleted: new Date() });
    }

    progress.lastUpdated = new Date();
    await progress.save();
    res.status(200).json({ message: `Workout on ${day} marked as completed!`, progress });
  } catch (error) {
    res.status(500).json({ message: "Error marking workout as completed", error: error.message });
  }
};

// ✅ Reschedule a Missed Workout
exports.rescheduleWorkout = async (req, res) => {
  try {
    const { programId, missedDay, newDay } = req.body;
    const clientId = req.user.id;

    let progress = await Progress.findOne({ clientId, programId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    const missedIndex = progress.completedDays.findIndex(d => d.day === missedDay);
    if (missedIndex === -1) return res.status(404).json({ message: "Missed workout not found" });

    progress.completedDays[missedIndex].day = newDay;
    progress.lastUpdated = new Date();
    await progress.save();

    res.status(200).json({ message: `Workout rescheduled to ${newDay}`, progress });
  } catch (error) {
    res.status(500).json({ message: "Error rescheduling workout", error: error.message });
  }
};

// ✅ Submit Feedback for a Session
exports.submitFeedback = async (req, res) => {
  try {
    const { programId, sessionId, feedback } = req.body;
    const clientId = req.user.id;

    let progress = await Progress.findOne({ clientId, programId });
    if (!progress) {
      progress = new Progress({ clientId, programId, sessionTracking: [] });
    }

    progress.sessionTracking.push({
      sessionId,
      completed: true,
      feedback,
      dateCompleted: new Date(),
    });

    progress.lastUpdated = new Date();
    await progress.save();
    res.status(201).json({ message: "Feedback submitted!", progress });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

// ✅ Fetch User Progress for a Program
exports.getUserProgress = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { programId } = req.params;

    const progress = await Progress.findOne({ clientId, programId });
    if (!progress) return res.status(404).json({ message: "No progress found" });

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error: error.message });
  }
};
// ✅ 1️⃣ Restart Program (Resets Progress)
exports.restartProgram = async (req, res) => {
  try {
    const { programId } = req.body;
    const clientId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // Reset completedDays for this user
    program.completedDays = program.completedDays.filter(day => day.clientId.toString() !== clientId);
    await program.save();

    res.status(200).json({ message: "Program successfully restarted!" });
  } catch (error) {
    res.status(500).json({ message: "Error restarting program", error: error.message });
  }
};

// ✅ 2️⃣ Mark Workout as Completed & Check for Achievements
exports.completeWorkout = async (req, res) => {
  try {
    const { programId, day } = req.body;
    const clientId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // Prevent duplicate entries
    if (!program.completedDays.some(d => d.clientId.toString() === clientId && d.day === day)) {
      program.completedDays.push({ clientId, day, completed: true, dateCompleted: new Date() });
      await program.save();
    }

    // 🏆 Check for Achievement Badges
    const completedDays = program.completedDays.filter(d => d.clientId.toString() === clientId).length;
    let badge = null;
    if (completedDays === 5) badge = "🏆 5 Günlük Seri!";
    if (completedDays === 10) badge = "🔥 10 Günlük Başarı!";
    if (completedDays === 15) badge = "💪 15 Günlük Devamlılık!";

    res.status(200).json({ message: `Gün ${day} tamamlandı!`, badge });
  } catch (error) {
    res.status(500).json({ message: "Error completing workout", error: error.message });
  }
};

// ✅ 3️⃣ Fetch Progress for a User's Program
exports.getUserProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const clientId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const userProgress = {
      programId,
      completedDays: program.completedDays.filter(d => d.clientId.toString() === clientId),
      missedWorkouts: program.dailySchedule
        .filter(day => !program.completedDays.some(d => d.clientId.toString() === clientId && d.day === day.day))
        .map(day => ({ missedDay: day.day })),
      progressiveOverload: program.progressiveOverload.filter(po => po.clientId.toString() === clientId),
    };

    res.status(200).json(userProgress);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user progress", error: error.message });
  }
};

// ✅ 4️⃣ Reschedule a Missed Workout
exports.rescheduleWorkout = async (req, res) => {
  try {
    const { programId, missedDay, newDay } = req.body;
    const clientId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // Remove missed day from "missedWorkouts"
    program.completedDays = program.completedDays.filter(d => !(d.clientId.toString() === clientId && d.day === missedDay));

    // Add new scheduled day
    program.completedDays.push({ clientId, day: newDay, completed: false });

    await program.save();
    res.status(200).json({ message: `Missed day '${missedDay}' rescheduled to '${newDay}'!` });
  } catch (error) {
    res.status(500).json({ message: "Error rescheduling workout", error: error.message });
  }
};

// ✅ 5️⃣ Submit Workout Feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { programId, message } = req.body;
    const clientId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    program.feedback.push({ clientId, feedbackText: message, date: new Date() });
    await program.save();

    res.status(201).json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};
exports.updateAdaptiveAdjustments = async (req, res) => {
  try {
    const { programId, exerciseName, fatigueLevel } = req.body;

    const progress = await Progress.findOne({ programId, clientId: req.user.id });

    if (!progress) return res.status(404).json({ message: "Progress not found" });

    let adjustment = { suggestedWeightIncrease: 0, suggestedRepsIncrease: 0 };

    if (fatigueLevel === "Low") {
      adjustment = { suggestedWeightIncrease: 2.5, suggestedRepsIncrease: 2 };
    } else if (fatigueLevel === "High") {
      adjustment = { suggestedWeightIncrease: -2.5, suggestedRepsIncrease: -2 };
    }

    // Update the progress model
    progress.adaptiveAdjustments.push({ exerciseName, ...adjustment, fatigueLevel });
    await progress.save();

    res.status(200).json({ message: "Adjustment saved", adjustment });
  } catch (error) {
    res.status(500).json({ message: "Error updating adaptive adjustments", error: error.message });
  }
};
exports.updateGoalProgress = async (req, res) => {
  try {
    const { programId, currentMetric } = req.body;

    const progress = await Progress.findOne({ programId, clientId: req.user.id });

    if (!progress) return res.status(404).json({ message: "Progress not found" });

    // Auto-calculate progress percentage
    progress.goalTracking.currentMetric = currentMetric;
    progress.goalTracking.progressPercentage = 
      ((currentMetric - progress.goalTracking.initialMetric) / 
      (progress.goalTracking.targetMetric - progress.goalTracking.initialMetric)) * 100;

    await progress.save();
    res.status(200).json({ message: "Goal progress updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating goal progress", error: error.message });
  }
};
exports.getProgressTrend = async (req, res) => {
  try {
    const { programId } = req.params;
    const progress = await Progress.find({ programId, clientId: req.user.id });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    const trendData = progress.completedDays.map(day => ({
      date: day.dateCompleted,
      completed: day.completed,
    }));

    res.status(200).json({ trendData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress trend", error: error.message });
  }
};


