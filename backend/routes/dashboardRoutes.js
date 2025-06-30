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

// Route to fetch user-specific programs
router.get("/user-programs", protect, getUserPrograms);

// Route to fetch analytics
router.get("/analytics/coach", protect, roleMiddleware(["coach"]), getAnalyticsForCoach); // Coach-specific analytics
router.get("/analytics/user", protect, roleMiddleware(["user"]), getAnalyticsForUser); // User-specific analytics

// Routes for notifications
router.post("/notifications", protect, roleMiddleware(["coach"]), sendNotification); // Send notification (coach only)
router.get("/notifications/coach", protect, roleMiddleware(["coach"]), getNotificationsForCoach); // Get notifications sent by a coach
router.get("/notifications/user", protect, roleMiddleware(["user"]), getNotificationsForUser); // Get notifications for a user
router.post("/notifications/read/:notificationId", protect, markNotificationAsRead); // Mark notification as read

// Client routes
router.get("/clients", protect, roleMiddleware(["coach"]), getClients);
router.get("/clients/:id", protect, roleMiddleware(["coach"]), getClientDetails);

// Feedback routes
router.get("/feedbacks", protect, roleMiddleware(["coach"]), getFeedbacks);
router.post("/feedbacks/read/:id", protect, roleMiddleware(["coach"]), markFeedbackAsRead);
router.delete("/feedbacks/:id", protect, roleMiddleware(["coach"]), deleteFeedback);
router.post("/feedbacks/reply", protect, roleMiddleware(["coach"]), replyToFeedback); // Coach replies to feedback

// Coach analytics routes
router.get("/analytics/coach/full", protect, roleMiddleware(["coach"]), getFullCoachAnalytics);
router.get("/analytics/coach/summary", protect, roleMiddleware(["coach"]), getCoachAnalytics); // If you want both full & summary

// User schedule route
router.get("/schedule", protect, roleMiddleware(["user"]), getUserSchedule);

module.exports = router;
