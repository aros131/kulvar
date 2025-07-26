import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createTemplate, getTemplates, deleteTemplate } from '../controllers/exerciseTemplateController.js';

router.post("/", protect, roleMiddleware(["coach"]), createTemplate); // Create exercise template
router.get("/", protect, getTemplates); // Get all exercise templates
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteTemplate); // Delete a template

export default router;
