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
const computeStreaksFromDates = (dateStringsSet /* Set<string> */) => {
  const today = new Date(); today.setHours(0,0,0,0);

  // current streak: walk back from today
  let current = 0;
  const cur = new Date(today);
  while (dateStringsSet.has(ymd(cur))) {
    current += 1;
    cur.setDate(cur.getDate() - 1);
  }

  // longest streak: scan all dates in order
  const all = Array.from(dateStringsSet).sort();
  let longest = 0, run = 0, prev = null;
  for (const ds of all) {
    if (prev) {
      const p = new Date(prev); p.setDate(p.getDate() + 1);
      run = (ymd(p) === ds) ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = ds;
  }
  return { currentStreak: current, longestStreak: longest };
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

// 🟢 Mark a workout as completed (by session name) — now also recomputes percentage + streaks
const markWorkoutCompleted = async (req, res) => {
  try {
    const { programId, sessionName } = req.body;
    const userId = req.user._id;

    if (!programId || !sessionName) {
      return res.status(400).json({ message: "Eksik bilgi: programId ve sessionName gerekli" });
    }

    // load program and compute total sessions
    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program bulunamadı." });
    const days = Array.isArray(program?.dailySchedule) ? program.dailySchedule : [];
    const totalSessions = days.reduce((acc, d) => acc + (Array.isArray(d?.sessions) ? d.sessions.length : 0), 0);

    // try to resolve a real id for this name
    let resolvedSessionId = null;
    outer:
    for (const day of days) {
      const ss = Array.isArray(day?.sessions) ? day.sessions : [];
      for (const s of ss) {
        if ((s?.name || "").trim() === sessionName.trim()) {
          resolvedSessionId = String(s?.sessionId || s?._id || s?.id || sessionName);
          break outer;
        }
      }
    }
    if (!resolvedSessionId) resolvedSessionId = String(sessionName);

    let progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      progress = new Progress({ programId, userId, completedSessions: [], streakTracking: { current: 0, longest: 0 }, progressPercentage: 0 });
    }

    const list = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const exists = list.some(s => (s?.sessionId + "") === (resolvedSessionId + ""));
    if (!exists) {
      list.push({
        sessionId: resolvedSessionId,
        dateCompleted: new Date(),
        completed: true,
        status: "completed",
      });
      progress.completedSessions = list;
    }

    // recompute percentage
    const completedCount = progress.completedSessions.length;
    progress.progressPercentage = totalSessions > 0
      ? Math.min(100, Math.round((completedCount / totalSessions) * 100))
      : 0;

    // recompute streaks from completion dates
    const completedDates = new Set(progress.completedSessions.map(s => toISODate(s?.dateCompleted)).filter(Boolean));
    progress.streakTracking = computeStreaksFromDates(completedDates);

    await progress.save();
    res.status(200).json({ message: exists ? "Bu seans daha önce tamamlanmış." : "Workout marked as completed", progress });
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
    progress.progressPercentage = 0;
    progress.streakTracking = { current: 0, longest: 0 };

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

    const { currentStreak, longestStreak } = computeStreaksFromDates(completedDates);
    return res.status(200).json({ currentStreak, longestStreak });
  } catch (error) {
    console.error("getUserStreaks error:", error);
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

    const program = await Program.findById(programId).lean();
    const totalSessions =
      (Array.isArray(program?.dailySchedule) ? program.dailySchedule : [])
        .reduce((acc, day) => acc + (Array.isArray(day?.sessions) ? day.sessions.length : 0), 0);

    const completedArr = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const completedCount = completedArr.length;

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

// 🟢 Mark a session as completed (idempotent, accepts sessionId or sessionName)
const markSessionCompleted = async (req, res) => {
  try {
    const { programId, sessionId, sessionName, feedback, rating } = req.body;
    const userId = req.user._id;

    if (!programId || (!sessionId && !sessionName)) {
      return res.status(400).json({ message: "Eksik bilgi: programId ve (sessionId | sessionName) gerekli" });
    }

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program bulunamadı." });

    const days = Array.isArray(program?.dailySchedule) ? program.dailySchedule : [];
    const totalSessions = days.reduce((acc, d) => acc + (Array.isArray(d?.sessions) ? d.sessions.length : 0), 0);

    // Resolve real sessionId if only name is given
    let resolvedSessionId = sessionId || null;
    if (!resolvedSessionId && sessionName) {
      outer:
      for (const day of days) {
        const ss = Array.isArray(day?.sessions) ? day.sessions : [];
        for (const s of ss) {
          if ((s?.name || "").trim() === sessionName.trim()) {
            resolvedSessionId = String(s?.sessionId || s?._id || s?.id || sessionName);
            break outer;
          }
        }
      }
      if (!resolvedSessionId) resolvedSessionId = String(sessionName);
    }

    let progress = await Progress.findOne({ userId, programId });
    if (!progress) {
      progress = new Progress({
        userId,
        programId,
        completedSessions: [],
        streakTracking: { current: 0, longest: 0 },
        progressPercentage: 0,
      });
    }

    const list = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const already = list.some(cs => (cs?.sessionId + "") === (resolvedSessionId + ""));

    if (!already) {
      list.push({
        sessionId: resolvedSessionId,
        dateCompleted: new Date(),
        completed: true,
        status: "completed",
        feedback,
        rating,
      });
      progress.completedSessions = list;
    }

    // Recompute percentage
    const completedCount = progress.completedSessions.length;
    progress.progressPercentage = totalSessions > 0
      ? Math.min(100, Math.round((completedCount / totalSessions) * 100))
      : 0;

    // Recompute streaks from completion dates
    const completedDates = new Set(
      progress.completedSessions.map(s => toISODate(s?.dateCompleted)).filter(Boolean)
    );
    progress.streakTracking = computeStreaksFromDates(completedDates);

    await progress.save();

    return res.status(200).json({
      message: already ? "Bu seans daha önce tamamlanmış." : "Seans başarıyla tamamlandı",
      progress,
    });
  } catch (error) {
    console.error("Seans tamamlama hatası:", error);
    return res.status(500).json({ message: "Seans tamamlama hatası", error: error.message });
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

      const entry = completed.find(s => toISODate(s?.dateCompleted) === isoDate);

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
