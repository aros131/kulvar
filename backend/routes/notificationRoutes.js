const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  getCoachSentNotifications
} = require("../controllers/notificationController");

// 📨 Send a notification
router.post("/", protect, sendNotification);

// 📥 Get all notifications for the logged-in user
router.get("/user", protect, getUserNotifications);

// ✅ Mark a single notification as read
router.patch("/:id/read", protect, markNotificationAsRead);

// ✅ Mark all user notifications as read
router.patch("/user/mark-all-read", protect, markAllAsRead);
// 👨‍🏫 Get notifications sent by the coach (admin view)
router.get("/coach", protect, getCoachSentNotifications);


module.exports = router;
