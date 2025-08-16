import Progress from '../models/Progress.js';
import Program from '../models/Program.js';
// If your calendar model is named Calendar, change the next line accordingly:
import Event from '../models/Event.js';

// ------- small utils -------
const toISODate = (d) => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
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

// ------- calendar helpers (new) -------
const NOW = () => new Date();

/**
 * Mark the most relevant calendar event for this (user, program, sessionId)
 * as completed. Prefers an event within [-36h, +7d], otherwise the most recent past.
 * Returns the updated event or null.
 */
async function completeMatchingCalendarEvent({ userId, programId, sessionId }) {
  try {
    if (!Event || !sessionId) return null;

    const now = NOW();
    const startWindow = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const endWindow   = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);

    let ev = await Event.findOne({
      userId,
      programId,
      sessionId,
      status: { $ne: 'completed' },
      start: { $gte: startWindow, $lte: endWindow },
    }).sort({ start: 1 });

    if (!ev) {
      ev = await Event.findOne({
        userId,
        programId,
        sessionId,
        status: { $ne: 'completed' },
        start: { $lt: startWindow },
      }).sort({ start: -1 });
    }

    if (!ev) return null;

    ev.status = 'completed';
    ev.completedAt = NOW();
    await ev.save();
    return ev;
  } catch (e) {
    console.error('completeMatchingCalendarEvent error:', e?.message || e);
    return null;
  }
}

// Use events to compute per-day status over a window
async function computeDailyStatusesFromEvents({ userId, programId, from, to }) {
  // overlap window: event.start < (to + 1d) && event.end > (from)
  const events = await Event.find({
    userId,
    ...(programId ? { programId } : {}),
    start: { $lt: new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000) },
    end:   { $gt: from },
  }).lean();

  // Build day map
  const map = Object.create(null);
  const add = (date, field) => {
    map[date] ||= { completed: false, missed: false };
    map[date][field] = true;
  };

  const today = NOW();

  for (const ev of events) {
    const startDay = toISODate(ev.start);
    const endDay = toISODate(ev.end);
    const compDay = ev.completedAt ? toISODate(ev.completedAt) : null;

    if (ev.status === 'completed') {
      // prefer completedAt’s day; otherwise the start day
      add(compDay || startDay, 'completed');
    } else {
      // A scheduled event that already ended but not completed counts as missed on its start day
      if (new Date(ev.end) < today) add(startDay, 'missed');
    }
  }

  // Emit ordered days
  const days = [];
  const cur = new Date(from);
  while (cur <= to) {
    const ds = toISODate(cur);
    const cell = map[ds];
    const status = cell?.completed ? 'completed' : cell?.missed ? 'missed' : 'none';
    days.push({ date: ds, status });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

// ------- controllers -------

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
    track.push({ sessionName, fatigueLevel, weightUsed, repsCompleted, date: NOW() });
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

// 🟢 Mark a workout as completed (by session name) — now also updates the matching Calendar Event
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

    // resolve real session id for this name
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
        dateCompleted: NOW(),
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

    // 🔁 ALSO: mark the related calendar event as completed
    const updatedEvent = await completeMatchingCalendarEvent({ userId, programId, sessionId: resolvedSessionId });

    res.status(200).json({
      message: exists ? "Bu seans daha önce tamamlanmış." : "Workout marked as completed",
      progress,
      calendarEventUpdated: !!updatedEvent,
      event: updatedEvent || null,
    });
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
      { $push: { feedback: { session, feedback, date: NOW() } } },
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

// 🟢 Mark a session as completed (idempotent, accepts sessionId or sessionName) — now updates matching Calendar Event
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
        dateCompleted: NOW(),
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

    // 🔁 ALSO: mark the related calendar event as completed
    const updatedEvent = await completeMatchingCalendarEvent({ userId, programId, sessionId: resolvedSessionId });

    return res.status(200).json({
      message: already ? "Bu seans daha önce tamamlanmış." : "Seans başarıyla tamamlandı",
      progress,
      calendarEventUpdated: !!updatedEvent,
      event: updatedEvent || null,
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

// 🟢 Calendar heatmap (last 30 days) — prefers Events; falls back to Progress-only
const getCalendarHeatmap = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user._id;

    // Window: last 30 days (inclusive)
    const end = new Date(); end.setHours(0,0,0,0);
    const start = new Date(end); start.setDate(end.getDate() - 29);

    // Try events first
    try {
      const days = await computeDailyStatusesFromEvents({ userId, programId, from: start, to: end });
      return res.status(200).json({ days });
    } catch (e) {
      console.warn('Heatmap via events failed, falling back to Progress:', e?.message || e);
    }

    // Fallback: Progress-only (completed = green; missed = not derivable reliably -> keep "none")
    const progress = await Progress.findOne({ programId, userId });
    if (!progress) {
      // no data → all none
      const arr = [];
      const cur = new Date(start);
      while (cur <= end) {
        arr.push({ date: toISODate(cur), status: 'none' });
        cur.setDate(cur.getDate() + 1);
      }
      return res.status(200).json({ days: arr });
    }

    const completed = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const completedSet = new Set(completed.map(s => toISODate(s?.dateCompleted)).filter(Boolean));

    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      const ds = toISODate(cur);
      const status = completedSet.has(ds) ? 'completed' : 'none';
      days.push({ date: ds, status });
      cur.setDate(cur.getDate() + 1);
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
