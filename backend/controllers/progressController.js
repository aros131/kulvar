import Progress from '../models/Progress.js';
import Program from '../models/Program.js';

// small utils
const toISODate = (d) => {
  if (!d) return null;
  const dt = (d instanceof Date) ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split('T')[0];
};
const ymd = (d) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

// 🟢 Log user progress
const logProgress = async (req, res) => {
  try {
    const { programId, sessionName, fatigueLevel, weightUsed, repsCompleted } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      progress = new Progress({ programId, userId, sessionTracking: [], completedSessions: [] });
    }

    const track = Array.isArray(progress.sessionTracking) ? progress.sessionTracking : [];
    track.push({ sessionName, fatigueLevel, weightUsed, repsCompleted, date: new Date() });
    progress.sessionTracking = track;

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

// 🟢 Mark a workout as completed (by session name) — unified shape with markSessionCompleted
const markWorkoutCompleted = async (req, res) => {
  try {
    const { programId, sessionName } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      progress = new Progress({ programId, userId, completedSessions: [] });
    }

    const list = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const exists = list.some(s => s?.sessionId === sessionName);
    if (!exists) {
      list.push({
        sessionId: sessionName,
        dateCompleted: new Date(),
        completed: true,
        status: "completed",
      });
    }
    progress.completedSessions = list;

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
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress) return res.status(404).json({ message: "No progress found" });

    const arr = Array.isArray(progress.missedWorkouts) ? progress.missedWorkouts : [];
    arr.push({ missedDay, rescheduledTo: newDay });
    progress.missedWorkouts = arr;

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
    const userId = req.user._id;

    const progress = await Progress.findOneAndUpdate(
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
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    progress.completedSessions = [];
    progress.sessionTracking = [];

    await progress.save();
    res.status(200).json({ message: "Program successfully restarted", progress });
  } catch (error) {
    res.status(500).json({ message: "Error restarting program", error: error.message });
  }
};

// 🟢 Get user workout streaks (SAFE) — computes from completedSessions.dateCompleted
const getUserStreaks = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const docs = await Progress.find({ userId }).lean();
    const list = Array.isArray(docs) ? docs : [];

    // collect set of YYYY-MM-DD dates with at least one completed session
    const completedDates = new Set();
    list.forEach((doc) => {
      const arr = Array.isArray(doc?.completedSessions) ? doc.completedSessions : [];
      arr.forEach((s) => {
        const iso = toISODate(s?.dateCompleted || s?.date || null);
        if (iso && (s?.completed === true || s?.status === "completed" || s?.completed == null)) {
          completedDates.add(iso);
        }
      });
    });

    // compute currentStreak (from today backwards)
    const today = new Date(); today.setHours(0,0,0,0);
    let currentStreak = 0;
    const cursor = new Date(today);
    while (completedDates.has(ymd(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // compute longestStreak across all dates
    const sorted = Array.from(completedDates).sort(); // asc
    let longestStreak = 0, run = 0, prev = null;
    for (const ds of sorted) {
      if (prev) {
        const p = new Date(prev); p.setDate(p.getDate() + 1);
        if (ymd(p) === ds) run += 1; else run = 1;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
      prev = ds;
    }

    return res.status(200).json({ currentStreak, longestStreak });
  } catch (error) {
    console.error("getUserStreaks error:", error);
    // return a safe payload instead of crashing the UI
    return res.status(200).json({ currentStreak: 0, longestStreak: 0 });
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
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      return res.status(404).json({ message: "Strength progress not found." });
    }

    const po = Array.isArray(progress.progressiveOverload) ? progress.progressiveOverload : [];
    res.status(200).json({
      strength: po.map(entry => ({
        exerciseName: entry?.exerciseName,
        currentWeight: entry?.currentWeight,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching strength progress", error: error.message });
  }
};

// 🟢 Get user progress for a specific program (frontend-friendly shape)
const getUserProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      return res.status(404).json({ message: "No progress found for this program." });
    }

    // totalSessions from Program.dailySchedule
    const program = await Program.findById(programId).lean();
    const totalSessions =
      (Array.isArray(program?.dailySchedule) ? program.dailySchedule : [])
        .reduce((acc, day) => acc + (Array.isArray(day?.sessions) ? day.sessions.length : 0), 0);

    const completedArr = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const completedCount = completedArr.length;

    // number result (not string)
    const progressPercentage =
      totalSessions > 0 ? Number(((completedCount / totalSessions) * 100).toFixed(2)) : 0;

    res.status(200).json({
      progressPercentage,                                   // number
      completedSessions: completedArr.map(s => ({           // array of { sessionId }
        sessionId: s?.sessionId,
      })),
      totalSessions,                                        // number
      streakTracking: progress.streakTracking || { current: 0, longest: 0 },
      achievementBadges: Array.isArray(progress.achievementBadges) ? progress.achievementBadges : [],
      goalTracking: progress.goalTracking || {},
      missedWorkouts: Array.isArray(progress.missedWorkouts) ? progress.missedWorkouts : [],
      strengthProgress: (Array.isArray(progress.progressiveOverload) ? progress.progressiveOverload : []).map(entry => ({
        exerciseName: entry?.exerciseName,
        currentWeight: entry?.currentWeight,
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
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress || !progress.trendData) {
      return res.status(404).json({ message: "No progress data found." });
    }

    res.status(200).json({ progress: progress.trendData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress trend", error: error.message });
  }
};

// 🟢 Mark a session as completed (idempotent, correct percentage)
const markSessionCompleted = async (req, res) => {
  try {
    const { programId, sessionId, feedback, rating } = req.body;
    const userId = req.user._id;

    if (!programId || !sessionId) {
      return res.status(400).json({ message: "Eksik bilgi: programId veya sessionId yok" });
    }

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program bulunamadı." });

    const totalSessions =
      (Array.isArray(program?.dailySchedule) ? program.dailySchedule : [])
        .reduce((acc, day) => acc + (Array.isArray(day?.sessions) ? day.sessions.length : 0), 0);

    // Insert only if sessionId not already present
    const updated = await Progress.findOneAndUpdate(
      { userId, programId, "completedSessions.sessionId": { $ne: sessionId } },
      {
        $setOnInsert: {
          userId,
          programId,
          completedSessions: [],
          streakTracking: { current: 0, longest: 0 },
          progressPercentage: 0,
        },
        $push: {
          completedSessions: {
            sessionId,
            dateCompleted: new Date(),
            completed: true,
            status: "completed",
            feedback,
            rating,
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!updated) {
      return res.status(400).json({ message: "Bu seans zaten tamamlandı." });
    }

    // Recompute percentage + streaks
    const completed = Array.isArray(updated.completedSessions) ? updated.completedSessions.length : 0;
    const percent = totalSessions > 0 ? Math.min(100, Math.round((completed / totalSessions) * 100)) : 0;

    const newCurrent = (updated.streakTracking?.current || 0) + 1;
    const newLongest = Math.max(updated.streakTracking?.longest || 0, newCurrent);

    const final = await Progress.findByIdAndUpdate(
      updated._id,
      {
        $set: {
          progressPercentage: percent,
          "streakTracking.current": newCurrent,
          "streakTracking.longest": newLongest,
        },
      },
      { new: true }
    );

    return res.status(200).json({ message: "Seans başarıyla tamamlandı", progress: final });
  } catch (error) {
    console.error("Seans tamamlama hatası:", error.message);
    return res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
};

// 🟢 Update user goal progress
const updateGoalProgress = async (req, res) => {
  try {
    const { programId, goalMetric, value } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      progress = new Progress({ programId, userId, goalProgress: {} });
    }

    progress.goalProgress = { ...(progress.goalProgress || {}), [goalMetric]: value };
    await progress.save();

    res.status(200).json({ message: "Goal progress updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating goal progress", error: error.message });
  }
};

// 🟢 Get progress percentages for all assigned programs
const getAllProgramProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const assignedPrograms = await Program.find({ assignedClients: userId }).lean();
    const programProgress = await Promise.all(
      (Array.isArray(assignedPrograms) ? assignedPrograms : []).map(async (program) => {
        const progress = await Progress.findOne({ programId: program._id, userId }).lean();
        const percentage = progress ? (Number(progress.progressPercentage) || 0) : 0;
        return {
          programId: program._id,
          name: program.name,
          description: program.description,
          duration: program.duration,
          progressPercentage: percentage,
        };
      })
    );

    res.status(200).json({ programProgress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching program progress", error: error.message });
  }
};

// 🟢 Calendar heatmap (last 30 days) — safe date handling
const getCalendarHeatmap = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      return res.status(404).json({ message: "No progress found" });
    }

    const completed = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const days = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const isoDate = ymd(date);

      const entry = completed.find(s => {
        const entryDate = toISODate(s?.dateCompleted);
        return entryDate === isoDate;
      });

      let status = "none";
      if (entry?.completed) status = "completed";
      else if (entry && !entry.completed) status = "missed";

      days.unshift({ date: isoDate, status });
    }

    res.status(200).json({ days });
  } catch (error) {
    res.status(500).json({ message: "Error fetching calendar heatmap", error: error.message });
  }
};

// ✅ Export all functions
export {
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
  getCalendarHeatmap
};
