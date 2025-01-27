const Program = require("../models/Program");

// Create a new program
exports.createProgram = async (req, res) => {
  try {
    const { name, description, duration, dailySchedule, nutritionPlan, documents } = req.body;

    // Create the program
    const newProgram = await Program.create({
      name,
      description,
      duration,
      dailySchedule,
      nutritionPlan,
      documents,
      coachId: req.user.id, // Authenticated coach
    });

    res.status(201).json({ message: "Program created successfully", program: newProgram });
  } catch (error) {
    res.status(500).json({ message: "Error creating program", error: error.message });
  }
};

// Get all programs for the logged-in coach
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ coachId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving programs", error: error.message });
  }
};

// Update an existing program
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProgram = await Program.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ message: "Program updated successfully", program: updatedProgram });
  } catch (error) {
    res.status(500).json({ message: "Error updating program", error: error.message });
  }
};

// Delete a program
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProgram = await Program.findByIdAndDelete(id);

    if (!deletedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting program", error: error.message });
  }
};
