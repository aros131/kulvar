const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const dashboardController = require("../controllers/dashboardController");
const { createProgram, getPrograms, updateProgram,deleteProgram } = require("../controllers/dashboardController");



// Analytics
router.get("/analytics", protect, roleMiddleware(["coach"]), dashboardController.getAnalytics);

// Notifications
router.post("/notifications", protect, roleMiddleware(["coach"]), dashboardController.sendNotification);
router.get("/notifications", protect, roleMiddleware(["coach"]), dashboardController.getNotifications);

module.exports = router;
