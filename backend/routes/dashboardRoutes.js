const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { sendNotification, getNotificationsForCoach, getNotificationsForUser } = require("../controllers/dashboardController");
// Import dashboardController
const { 
  getUserPrograms,
  getAnalyticsForCoach, 
  getAnalyticsForUser 
} = require("../controllers/dashboardController");

// Route to fetch user-specific programs
router.get("/user-programs", protect, getUserPrograms);

// Route to fetch analytics (coaches only)
router.get("/analytics/coach", protect, roleMiddleware(["coach"]), getAnalyticsForCoach); // Coach-specific analytics
router.get("/analytics/user", protect, roleMiddleware(["user"]), getAnalyticsForUser); // User-specific analytics

// Routes for notifications (coaches only)
router.post("/notifications", protect, roleMiddleware(["coach"]), sendNotification); // Send notification (coach only)
router.get("/notifications/coach", protect, roleMiddleware(["coach"]), getNotificationsForCoach); // Get notifications sent by a coach
router.get("/notifications/user", protect, roleMiddleware(["user"]), getNotificationsForUser); // Get notifications for a user

module.exports = router;
