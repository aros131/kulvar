const express = require("express");
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

// Coach Dashboard Routes
router.get("/programs", protect, roleMiddleware(["coach"]), dashboardController.getPrograms);
router.get("/clients", protect, roleMiddleware(["coach"]), dashboardController.getClients);
router.get("/analytics", protect, roleMiddleware(["coach"]), dashboardController.getAnalytics);

// User Dashboard Routes
router.get("/user-programs", protect, roleMiddleware(["user"]), dashboardController.getUserPrograms);
router.get("/progress", protect, roleMiddleware(["user"]), dashboardController.getProgress);

module.exports = router;
