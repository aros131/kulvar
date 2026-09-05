import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { generateReport, getReports } from '../controllers/reportController.js';

router.post("/", protect, roleMiddleware(["coach"]), generateReport); // Generate a custom analytics report
router.get("/", protect, roleMiddleware(["coach"]), getReports); // Get all generated reports

export default router;
