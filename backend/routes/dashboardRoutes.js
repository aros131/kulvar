const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  sendNotification,
  getNotificationsForCoach,
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
  getFullCoachAnalytics
} = require("../controllers/dashboardController");

// ✅ User Programs & Schedule
router.get("/user-programs", protect, getUserPrograms);
router.get("/schedule", protect, roleMiddleware(["user"]), getUserSchedule);

// ✅ Coach Analytics
router.get("/analytics/coach/full", protect, roleMiddleware(["coach"]), getFullCoachAnalytics);
router.get("/analytics/coach/summary", protect, roleMiddleware(["coach"]), getCoachAnalytics);
router.get("/analytics/coach", protect, roleMiddleware(["coach"]), getAnalyticsForCoach);
router.get("/analytics/user", protect, roleMiddleware(["user"]), getAnalyticsForUser);

// ✅ Notifications
router.post("/notifications", protect, roleMiddleware(["coach"]), sendNotification);
router.get("/notifications/coach", protect, roleMiddleware(["coach"]), getNotificationsForCoach);
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

module.exports = router;
