const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const { Program } = require("../models");

const router = express.Router();

// Protected Route: Create a Program
router.post("/programs", authenticateToken, authorizeRole("coach"), async (req, res) => {
  const { title, description, category, price, duration } = req.body;

  try {
    const program = await Program.create({
      title,
      description,
      category,
      price,
      duration,
      coachId: req.user.id, // Associate program with the logged-in coach
    });

    res.status(201).json({
      message: "Program created successfully",
      program,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      message: "Failed to create program",
      error,
    });
  }
});

// Protected Route: Get All Programs for the Logged-In Coach
router.get("/programs", authenticateToken, authorizeRole("coach"), async (req, res) => {
  try {
    const programs = await Program.findAll({
      where: { coachId: req.user.id }, // Filter by logged-in coach's ID
      attributes: ["id", "title", "description", "category", "price", "duration"], // Select only relevant fields
    });

    if (programs.length === 0) {
      return res.status(200).json({ message: "No programs found for this coach." });
    }

    res.status(200).json({ programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      message: "Failed to fetch programs",
      error,
    });
  }
});

// Export the router
module.exports = router;
