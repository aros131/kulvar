const express = require("express");
const { Program, Transaction } = require("../models"); // Import the models
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Route: Get all programs (public access)
router.get("/", async (req, res) => {
  try {
    const programs = await Program.findAll({
      attributes: ["id", "title", "description", "category", "price", "duration", "coachId"],
    });

    if (programs.length === 0) {
      return res.status(200).json({ message: "No programs available at the moment." });
    }

    res.status(200).json({ programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs", error });
  }
});

// Route: Get all programs for a specific coach (protected)
router.get("/coach", authenticateToken, authorizeRole("coach"), async (req, res) => {
  try {
    const programs = await Program.findAll({ where: { coachId: req.user.id } });
    res.status(200).json({ programs });
  } catch (error) {
    console.error("Error fetching programs for coach:", error);
    res.status(500).json({ message: "Failed to fetch programs", error });
  }
});

// Protected Route: Create a new program
router.post("/", authenticateToken, authorizeRole("coach"), async (req, res) => {
  const { title, description, category, price, duration } = req.body;

  try {
    const program = await Program.create({
      title,
      description,
      category,
      price,
      duration,
      coachId: req.user.id,
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

// Protected Route: Delete a program
router.delete("/:id", authenticateToken, authorizeRole("coach"), async (req, res) => {
  const { id } = req.params;

  try {
    const program = await Program.findOne({ where: { id, coachId: req.user.id } });

    if (!program) {
      return res.status(404).json({ message: "Program not found or you do not have permission to delete it." });
    }

    await program.destroy();
    res.status(200).json({ message: "Program deleted successfully." });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program", error });
  }
});

// Protected Route: Purchase a program
router.post("/:id/purchase", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const program = await Program.findOne({ where: { id } });
    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      programId: id,
      amount: program.price,
    });

    res.status(201).json({
      message: "Program purchased successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Error purchasing program:", error);
    res.status(500).json({ message: "Failed to purchase program", error });
  }
});

module.exports = router;
