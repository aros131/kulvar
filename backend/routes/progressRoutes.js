import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

// ✅ Import necessary controllers
import {
  logProgress,
  getClientProgress,
  getProgressReport,
  markSessionCompleted,
  rescheduleWorkout,
  submitFeedback,
  getUserProgress,
  restartProgram,
  getProgressTrend, 
  updateGoalProgress,
  getUserStreaks,
  getAdaptiveGoalProgress,
  getStrengthProgress,
  getAllProgramProgress,
  getCalendarHeatmap
} from '../controllers/progressController.js';

// ✅ Log user progress (User Only)
router.post("/", protect, roleMiddleware(["user"]), logProgress);

// ✅ Get progress for all clients (Coach Only)
router.get("/", protect, roleMiddleware(["coach"]), getClientProgress);

// ✅ Get detailed report for a client (Coach Only)
router.get("/:id/report", protect, roleMiddleware(["coach"]), getProgressReport);

// ✅ Mark a session as completed (User Only)
router.post("/complete-session", protect, roleMiddleware(["user"]), markSessionCompleted);


// ✅ Reschedule a missed workout (User Only)
router.post("/reschedule", protect, roleMiddleware(["user"]), rescheduleWorkout);

// ✅ Submit workout feedback (User Only)
router.post("/feedback", protect, roleMiddleware(["user"]), submitFeedback);

// ✅ Fetch user progress for a specific program (User Only)
router.get("/user/:programId", protect, roleMiddleware(["user"]), getUserProgress);

// ✅ Restart a program (User Only)
router.post("/restart", protect, roleMiddleware(["user"]), restartProgram);

// ✅ Get progress trend for a program
router.get("/progress-trend/:programId", protect, getProgressTrend);

// ✅ Update Goal Tracking Automatically (User Only)
router.post("/goal-progress", protect, roleMiddleware(["user"]), updateGoalProgress);

// ✅ Get User Streaks (User Only)
router.get("/streaks/:userId", protect, roleMiddleware(["user"]), getUserStreaks);

// ✅ Fetch goal progress for adaptive tracking (User Only)
router.get("/goal-progress/:userId", protect, roleMiddleware(["user"]), getAdaptiveGoalProgress);

// ✅ Get strength progress for a program
router.get("/strength-chart/:programId", protect, getStrengthProgress);

// ✅ Get all program progress (User Only or Coach depending on implementation)
router.get("/all-program-progress", protect, getAllProgramProgress);

router.get("/calendar/:programId", protect, roleMiddleware(["user"]), getCalendarHeatmap);

// GET /progress/overload-suggestions?programId=xxx
// Analyses the last completed WorkoutLog for this program and returns per-exercise suggestions.
import WorkoutLog from '../models/WorkoutLog.js';
router.get('/overload-suggestions', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { programId } = req.query;
    const query = { userId };
    if (programId) query.programId = programId;

    const lastLog = await WorkoutLog.findOne(query).sort({ date: -1 }).lean();
    if (!lastLog) return res.json({ suggestions: [] });

    const suggestions = lastLog.exercises
      .filter(ex => ex.sets?.length && ex.sets.every(s => s.completed))
      .map(ex => {
        const lastWeight = ex.sets[ex.sets.length - 1]?.weight ?? ex.plannedWeight ?? 0;
        const lastReps   = ex.sets[ex.sets.length - 1]?.reps   ?? ex.plannedReps   ?? 0;
        const hasWeight  = lastWeight > 0;

        // Average RIR across sets that logged one; null if this log predates RIR capture.
        const rirValues = ex.sets.map(s => s.rir).filter(r => r != null);
        const avgRir = rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;

        let suggestedWeight = null;
        let suggestedReps = null;
        let note = null;

        if (avgRir == null) {
          // No RIR data on this log — fall back to the original naive heuristic.
          suggestedWeight = hasWeight ? Math.round((lastWeight + 2.5) * 2) / 2 : null;
          suggestedReps   = !hasWeight && lastReps ? lastReps + 1 : null;
        } else if (avgRir >= 3) {
          suggestedWeight = hasWeight ? Math.round((lastWeight + 2.5) * 2) / 2 : null;
          suggestedReps   = !hasWeight && lastReps ? lastReps + 2 : null;
          note = 'RIR yüksekti, yükü artırabilirsin';
        } else if (avgRir <= 1) {
          suggestedWeight = hasWeight ? Math.round((lastWeight * 0.95) * 2) / 2 : null;
          note = 'RIR düşüktü, aynı yükte kal ya da hafif azalt';
        } else {
          note = 'İyi gidiyor, aynı yükte devam et';
        }

        return {
          exerciseName:    ex.name,
          lastWeight:      lastWeight || null,
          lastReps:        lastReps   || null,
          suggestedWeight,
          suggestedReps,
          avgRir,
          note,
        };
      });

    res.json({ suggestions, logDate: lastLog.date });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
