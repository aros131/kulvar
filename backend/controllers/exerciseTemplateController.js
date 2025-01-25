const ExerciseTemplate = require("../models/ExerciseTemplate");

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, videoUrl } = req.body;

    const template = new ExerciseTemplate({
      name,
      description,
      videoUrl,
      coachId: req.user.id, // Requires `req.user` from protect middleware
    });

    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: "Failed to create template.", error: err.message });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await ExerciseTemplate.find({ coachId: req.user.id });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch templates.", error: err.message });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ExerciseTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found." });

    if (template.coachId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this template." });
    }

    await template.remove();
    res.json({ message: "Template deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete template.", error: err.message });
  }
};
