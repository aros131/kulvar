const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  sendNotification,
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

router.post("/", protect, sendNotification);
router.get("/", protect, getNotifications);
router.patch("/user/:id/read", protect, markNotificationAsRead); // ✅ new route

module.exports = router;
