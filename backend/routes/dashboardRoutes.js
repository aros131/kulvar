import express from 'express';
const router = express.Router();

import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getMyRules, putMyRules } from '../controllers/availabilityController.js';
import {
  

  getNotificationsForUser,
  getClients,
  getClientDetails,
  getFeedbacks,
  markFeedbackAsRead,
  deleteFeedback,
  getUserPrograms,
  getAnalyticsForCoach,
  getAnalyticsForUser,
  getCoachAnalytics,
  getUserSchedule,
  markNotificationAsRead,
  replyToFeedback,
  getFullCoachAnalytics,
   getMyCoachesForUser,
} from '../controllers/dashboardController.js';

// ✅ User Programs & Schedule
router.get("/user-programs", protect, getUserPrograms);
router.get("/schedule", protect, roleMiddleware(["user"]), getUserSchedule);

// ✅ Coach Analytics
router.get("/analytics/coach/full", protect, roleMiddleware(["coach"]), getFullCoachAnalytics);
router.get("/analytics/coach/summary", protect, roleMiddleware(["coach"]), getCoachAnalytics);
router.get("/analytics/coach", protect, roleMiddleware(["coach"]), getAnalyticsForCoach);
router.get("/analytics/user", protect, roleMiddleware(["user"]), getAnalyticsForUser);

// ✅ Notifications
// ✅ Coach Availability (WEEKLY RULES)
router.get("/me/availability/rules", protect, roleMiddleware(["coach"]), getMyRules);
router.put("/me/availability/rules", protect, roleMiddleware(["coach"]), putMyRules);

router.get("/notifications/user", protect, roleMiddleware(["user"]), getNotificationsForUser);
router.post("/notifications/read/:notificationId", protect, markNotificationAsRead);

// ✅ Feedbacks
router.get("/feedbacks", protect, roleMiddleware(["coach"]), getFeedbacks);
router.post("/feedbacks/read/:id", protect, roleMiddleware(["coach"]), markFeedbackAsRead);
router.delete("/feedbacks/:id", protect, roleMiddleware(["coach"]), deleteFeedback);
router.post("/feedbacks/reply", protect, roleMiddleware(["coach"]), replyToFeedback);

// ✅ Clients
router.get("/clients", protect, roleMiddleware(["coach"]), getClients);
router.get("/clients/:id", protect, roleMiddleware(["coach"]), getClientDetails); // leave dynamic last
router.get(
  "/user/coaches",
  protect,
  roleMiddleware(["user"]),
  getMyCoachesForUser
);
export default router;
