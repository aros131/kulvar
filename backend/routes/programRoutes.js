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
  trackSessionCompletion,
  submitFeedback,
  getProgramDocuments,
  updateProgramDocuments,
  updateWorkoutVideo,
  getSessionCompletionData,
  getProgramVideos,
  submitSessionFeedback,
  rescheduleWorkout
} = require("../controllers/programController");


// 🟢 Program Management Routes
router.post("/", protect, upload.array("documents"), createProgram);
router.get("/", protect, getPrograms);
router.get("/:id", protect, getProgramById);
router.put("/:id", protect, roleMiddleware(["coach"]), updateProgram);
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteProgram);

// 🟢 Assign & Clone Programs
router.post("/:programId/assign", protect, assignProgramToClients);
router.post("/:programId/clone", protect, cloneProgram);

// 🟢 Track Session Completion
router.post("/:programId/track-session", protect, trackSessionCompletion);

// 🟢 User Feedback
router.post("/:programId/feedback", protect, submitFeedback);
router.post("/session-feedback", protect, submitSessionFeedback);

// 🟢 Update & Retrieve Program Data
router.post("/:id/update-documents", protect, roleMiddleware(["coach"]), updateProgramDocuments);
router.post("/:id/update-video", protect, roleMiddleware(["coach"]), updateWorkoutVideo);
router.get("/:id/session-completion", protect, roleMiddleware(["coach"]), getSessionCompletionData);
router.get("/:id/documents", protect, getProgramDocuments);
router.get("/:id/videos", protect, getProgramVideos);

// 🟢 Reschedule Missed Workouts
router.post("/reschedule-workout", protect, rescheduleWorkout);

module.exports = router;
