const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { logProgress, getClientProgress, getProgressReport, } = require("../controllers/progressController");

router.post("/", protect, roleMiddleware(["user"]), logProgress); // Log user progress
router.get("/", protect, roleMiddleware(["coach"]), getClientProgress); // Get progress for all clients
router.get("/:id/report", protect, roleMiddleware(["coach"]), getProgressReport); // Get detailed report for a client
router.post("/complete", protect, progressController.markWorkoutCompleted);

// ✅ Reschedule a missed workout
router.post("/reschedule", protect, progressController.rescheduleWorkout);

// ✅ Submit feedback for a session
router.post("/feedback", protect, progressController.submitFeedback);

// ✅ Fetch user progress
router.get("/user/:programId", protect, progressController.getUserProgress);
// ✅ Restart a program
router.post("/restart", protect, progressController.restartProgram);

// ✅ Complete a workout
router.post("/complete", protect, progressController.completeWorkout);

// ✅ Get user progress for a program
router.get("/user/:programId", protect, progressController.getUserProgress);

// ✅ Reschedule a missed workout
router.post("/reschedule", protect, progressController.rescheduleWorkout);

// ✅ Submit workout feedback
router.post("/feedback", protect, progressController.submitFeedback);
module.exports = router;
