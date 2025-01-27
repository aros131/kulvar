const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { logProgress, getClientProgress, getProgressReport } = require("../controllers/progressController");

router.post("/", protect, roleMiddleware(["user"]), logProgress); // Log user progress
router.get("/", protect, roleMiddleware(["coach"]), getClientProgress); // Get progress for all clients
router.get("/:id/report", protect, roleMiddleware(["coach"]), getProgressReport); // Get detailed report for a client

module.exports = router;
