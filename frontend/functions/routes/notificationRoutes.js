import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';

import {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  getCoachSentNotifications
} from '../controllers/notificationController.js';

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


export default router;
