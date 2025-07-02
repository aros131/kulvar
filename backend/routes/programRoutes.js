const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// ✅ Import necessary controllers
const {
  createProgram,
  getPrograms,
  
  getProgramById,
  updateProgram,
  deleteProgram,
  assignProgramToClients,
  cloneProgram,
  getUserPrograms,
  trackSessionCompletion,
  submitFeedback,
  getProgramDocuments,
  updateProgramDocuments,
  updateWorkoutVideo,
  getSessionCompletionData,
  getProgramVideos,
  submitSessionFeedback,
  rescheduleWorkout,
  getAssignedClients,
  resetProgress,
  updateAdaptiveAdjustments,
  getProgramFeedback,
  getUserProgress,
  completeSession,
  getAdaptiveAdjustments,
  getProgramMedia
 
  
 
  
} = require("../controllers/programController");

// 🟢 Program Management Routes
router.post("/", protect, roleMiddleware(["coach"]), upload.array("documents"), createProgram); // Create a program
router.get("/user-programs", protect, getUserPrograms);


router.get("/", protect, getPrograms); // Get all programs
router.get("/:id", protect, getProgramById); // Get a specific program by ID
router.put("/:id", protect, roleMiddleware(["coach"]), updateProgram); // Update program
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteProgram); // Delete program

// 🟢 Assign & Clone Programs
router.post("/:programId/assign", protect, roleMiddleware(["coach"]), assignProgramToClients); // Assign a program
router.post("/:programId/clone", protect, roleMiddleware(["coach"]), cloneProgram); // Clone a program

// 🟢 Track Session Completion
router.post("/:programId/track-session", protect, roleMiddleware(["user"]), trackSessionCompletion); // Track session completion

// 🟢 User Feedback
router.post("/:programId/feedback", protect, roleMiddleware(["user"]), submitFeedback); // Submit feedback for a program
router.post("/session-feedback", protect, roleMiddleware(["user"]), submitSessionFeedback); // Submit session feedback

// 🟢 Update & Retrieve Program Data
router.post("/:id/update-documents", protect, roleMiddleware(["coach"]), updateProgramDocuments); // Update program documents
router.post("/:id/update-video", protect, roleMiddleware(["coach"]), updateWorkoutVideo); // Update workout videos
router.get("/:id/session-completion", protect, roleMiddleware(["coach","user"]), getSessionCompletionData); // Get session completion data
router.get("/:id/documents", protect, getProgramDocuments); // Get program documents
router.get("/:id/videos", protect, getProgramVideos); // Get program videos

// 🟢 Reschedule Missed Workouts
router.post("/reschedule-workout", protect, roleMiddleware(["user"]), rescheduleWorkout); // Reschedule a workout


router.get("/:programId/assigned-clients", protect, roleMiddleware(["coach"]), getAssignedClients); // Fetch assigned clients for a program
// 🟢 Reset Progress
router.post("/:programId/reset-progress", protect, roleMiddleware(["user"]), resetProgress); // Reset user progress for a program
// 🟢 Adaptive Adjustments
router.post("/:programId/adaptive-adjustments", protect, roleMiddleware(["user"]), updateAdaptiveAdjustments); // Add fatigue-based adjustments
// Fetch feedback for a specific program
router.get("/:programId/feedback", protect, getProgramFeedback);
router.get("/:programId/user-progress", protect, getUserProgress);
router.post("/:programId/complete-session", protect, completeSession);

// ✅ Add this route to track session completion
router.post("/programs/:programId/track-session", trackSessionCompletion);

router.get("/:id/media", protect, getProgramMedia);
router.get("/:programId/adaptive-adjustments", protect, roleMiddleware(["user"]), getAdaptiveAdjustments);

module.exports = router;
