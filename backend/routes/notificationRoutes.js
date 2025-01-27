const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { sendNotification, getNotifications } = require("../controllers/notificationController");

router.post("/", protect, sendNotification); // Send notification
router.get("/", protect, getNotifications); // Fetch all notifications for the user

module.exports = router;
