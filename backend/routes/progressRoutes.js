const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  logProgress,
  getClientProgress,
  getProgressReport,
  markWorkoutCompleted,
  rescheduleWorkout,
  submitFeedback,
  getUserProgress,
  restartProgram,
  getProgressTrend,
  markSessionCompleted,
  getProgressTrend
} = require("../controllers/progressController");

// ✅ Log user progress
router.post("/", protect, roleMiddleware(["user"]), logProgress);

// ✅ Get progress for all clients (Coach Only)
router.get("/", protect, roleMiddleware(["coach"]), getClientProgress);

// ✅ Get detailed report for a client
router.get("/:id/report", protect, roleMiddleware(["coach"]), getProgressReport);

// ✅ Complete a workout
router.post("/complete", protect, markWorkoutCompleted);

// ✅ Reschedule a missed workout
router.post("/reschedule", protect, rescheduleWorkout);

// ✅ Submit workout feedback
router.post("/feedback", protect, submitFeedback);

// ✅ Fetch user progress for a program
router.get("/user/:programId", protect, getUserProgress);

// ✅ Restart a program
router.post("/restart", protect, restartProgram);

// ✅ Get progress trend
router.get("/progress-trend/:programId", protect, getProgressTrend);
// ✅ Complete a session
router.post("/session/complete", protect, markSessionCompleted);

// ✅ Fetch progress trend
router.get("/session-trend/:programId", protect, getProgressTrend);
module.exports = router;
