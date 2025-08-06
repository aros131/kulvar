import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import multer from 'multer';
const upload = multer({ dest: "uploads/" });

// ✅ Import necessary controllers
import {
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
  unassignClient,
  resetProgress,
  updateAdaptiveAdjustments,
  getProgramFeedback,
  getUserProgress,
  completeSession,
  getAdaptiveAdjustments,
  getProgramMedia,
  getCoachPrograms,
  getAllClients,
  assignProgramToGroup
 
  
 
  
} from '../controllers/programController.js';

// 🟢 Program Management Routes
router.post("/", protect, roleMiddleware(["coach"]), upload.array("documents"), createProgram);
router.get("/coach", protect, roleMiddleware(["coach"]), getCoachPrograms); // ✅ MUST come before /:id
router.get("/user-programs", protect, getUserPrograms);
router.get("/", protect, getPrograms);

// 🟢 Specific Program Actions (MUST COME AFTER static routes)
router.get("/:id", protect, getProgramById);
router.put("/:id", protect, roleMiddleware(["coach"]), updateProgram);
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteProgram);

// 🟢 Assign & Clone
router.post("/:programId/assign", protect, roleMiddleware(["coach"]), assignProgramToClients);
router.post("/:programId/clone", protect, roleMiddleware(["coach"]), cloneProgram);

// 🟢 Session & Progress Tracking
router.post("/:programId/track-session", protect, roleMiddleware(["user"]), trackSessionCompletion);
router.post("/:programId/complete-session", protect, completeSession);
router.post("/:programId/reset-progress", protect, roleMiddleware(["user"]), resetProgress);

// 🟢 Feedback
router.post("/:programId/feedback", protect, roleMiddleware(["user"]), submitFeedback);
router.post("/session-feedback", protect, roleMiddleware(["user"]), submitSessionFeedback);
router.get("/:programId/feedback", protect, getProgramFeedback);

// 🟢 Docs & Videos
router.post("/:id/update-documents", protect, roleMiddleware(["coach"]), updateProgramDocuments);
router.post("/:id/update-video", protect, roleMiddleware(["coach"]), updateWorkoutVideo);
router.get("/:id/documents", protect, getProgramDocuments);
router.get("/:id/videos", protect, getProgramVideos);
router.get("/:id/media", protect, getProgramMedia);

// 🟢 Analytics
router.get("/:id/session-completion", protect, roleMiddleware(["coach", "user"]), getSessionCompletionData);
router.get("/:programId/user-progress", protect, getUserProgress);
router.get("/:programId/adaptive-adjustments", protect, roleMiddleware(["user"]), getAdaptiveAdjustments);

// 🟢 Assignments
router.get("/:programId/assigned-clients", protect, roleMiddleware(["coach"]), getAssignedClients);
router.post("/:programId/unassign", protect, unassignClient);

// routes/userRoutes.js
router.get("/clients", protect, roleMiddleware(["coach"]), getAllClients);

// 🟢 Misc
router.post("/reschedule-workout", protect, roleMiddleware(["user"]), rescheduleWorkout);
router.post("/:programId/adaptive-adjustments", protect, roleMiddleware(["user"]), updateAdaptiveAdjustments);
router.post("/programs/:programId/track-session", trackSessionCompletion); // Redundant with above? Consider removing
router.post("/assign-group", protect, roleMiddleware(["coach"]), assignProgramToGroup);
export default router;



