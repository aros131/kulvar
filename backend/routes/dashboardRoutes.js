const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const dashboardController = require("../controllers/dashboardController");
const { createProgram, getPrograms, updateProgram,deleteProgram } = require("../controllers/dashboardController");

// Program Management
router.post("/programs", protect, roleMiddleware(["coach"]), dashboardController.createProgram);
router.get("/programs", protect, roleMiddleware(["coach"]), dashboardController.getPrograms);
router.put("/programs/:id", protect, roleMiddleware(["coach"]), dashboardController.updateProgram);
router.delete("/programs/:id", protect, roleMiddleware(["coach"]), dashboardController.deleteProgram);

// Assign Programs
router.post("/assign-program", protect, roleMiddleware(["coach"]), dashboardController.assignProgram);

// Client Management
router.get("/clients", protect, roleMiddleware(["coach"]), dashboardController.getClients);
router.get("/clients/:id/progress", protect, roleMiddleware(["coach"]), dashboardController.getClientProgress);

// Analytics
router.get("/analytics", protect, roleMiddleware(["coach"]), dashboardController.getAnalytics);

// Notifications
router.post("/notifications", protect, roleMiddleware(["coach"]), dashboardController.sendNotification);
router.get("/notifications", protect, roleMiddleware(["coach"]), dashboardController.getNotifications);

module.exports = router;
