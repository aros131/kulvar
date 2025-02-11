const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ✅ Import necessary controllers
const {
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
  getStrengthProgress
} = require("../controllers/progressController");

// ✅ Log user progress (User Only)
router.post("/", protect, roleMiddleware(["user"]), logProgress);

// ✅ Get progress for all clients (Coach Only)
router.get("/", protect, roleMiddleware(["coach"]), getClientProgress);

// ✅ Get detailed report for a client (Coach Only)
router.get("/:id/report", protect, roleMiddleware(["coach"]), getProgressReport);

// ✅ Mark a session as completed (User Only)
router.post("/session/complete", protect, roleMiddleware(["user"]), markSessionCompleted);

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

module.exports = router;
