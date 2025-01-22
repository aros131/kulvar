const express = require("express");
const { createTemplate, getTemplates, deleteTemplate } = require("../controllers/exerciseTemplateController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /exercise-templates: Create a new template
router.post("/", protect, createTemplate);

// GET /exercise-templates: Fetch all templates for the logged-in coach
router.get("/", protect, getTemplates);

// DELETE /exercise-templates/:id: Delete a template
router.delete("/:id", protect, deleteTemplate);

module.exports = router;
console.log({ createTemplate, getTemplates, deleteTemplate }); // Debugging
