const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { generateReport, getReports } = require("../controllers/reportController");

router.post("/", protect, roleMiddleware(["coach"]), generateReport); // Generate a custom analytics report
router.get("/", protect, roleMiddleware(["coach"]), getReports); // Get all generated reports

module.exports = router;
