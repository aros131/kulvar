import express from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
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
  getFullCoachAnalytics,
} from "../controllers/dashboardController.js";


// Route to fetch user-specific programs
router.get("/user-programs", protect, getUserPrograms);

// Route to fetch analytics (coaches only)
router.get("/analytics/coach", protect, roleMiddleware(["coach"]), getAnalyticsForCoach); // Coach-specific analytics
router.get("/analytics/user", protect, roleMiddleware(["user"]), getAnalyticsForUser); // User-specific analytics

// Routes for notifications (coaches only)
router.post("/notifications", protect, roleMiddleware(["coach"]), sendNotification); // Send notification (coach only)
router.get("/notifications/coach", protect, roleMiddleware(["coach"]), getNotificationsForCoach); // Get notifications sent by a coach


router.get("/clients", protect, roleMiddleware(["coach"]), getClients);
router.get("/clients/:id", protect, roleMiddleware(["coach"]), getClientDetails);

router.get("/feedbacks", protect, roleMiddleware(["coach"]), getFeedbacks);
router.post("/feedbacks/read/:id", protect, roleMiddleware(["coach"]), markFeedbackAsRead);
router.delete("/feedbacks/:id", protect, roleMiddleware(["coach"]), deleteFeedback);
// ✅ Import new functions
const { getCoachAnalytics, getUserSchedule, markNotificationAsRead, replyToFeedback } = require("../controllers/dashboardController");

// ✅ Get analytics for coaches (Total completed sessions)
router.get("/analytics/coach/full", protect, roleMiddleware(["coach"]), getCoachAnalytics);

// ✅ Get user schedule (Upcoming workouts)
router.get("/schedule", protect, roleMiddleware(["user"]), getUserSchedule);

// ✅ Mark notification as read
router.post("/notifications/read/:notificationId", protect, markNotificationAsRead);

// ✅ Coach replies to user feedback
router.post("/feedbacks/reply", protect, roleMiddleware(["coach"]), replyToFeedback);
const { getFullCoachAnalytics,} = require("../controllers/dashboardController");

// ✅ Get full analytics for coaches (including completed sessions)
router.get("/analytics/coach/full", protect, roleMiddleware(["coach"]), getFullCoachAnalytics);

router.get("/notifications/user", protect, roleMiddleware(["user"]), getNotificationsForUser);




module.exports = router;
