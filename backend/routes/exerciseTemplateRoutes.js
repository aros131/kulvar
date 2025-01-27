const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createTemplate, getTemplates, deleteTemplate } = require("../controllers/exerciseTemplateController");

router.post("/", protect, roleMiddleware(["coach"]), createTemplate); // Create exercise template
router.get("/", protect, getTemplates); // Get all exercise templates
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteTemplate); // Delete a template

module.exports = router;
