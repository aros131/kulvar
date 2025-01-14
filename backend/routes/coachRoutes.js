const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { Program } = require('../models');

const router = express.Router();

// Create a program
router.post('/programs', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
  const { title, description, price } = req.body;

  try {
    const program = await Program.create({
      title,
      description,
      price,
      coachId: req.user.id,
    });

    res.status(201).json({ message: 'Program created successfully', program });
  } catch (err) {
    res.status(500).json({ message: 'Error creating program', error: err });
  }
});

// Get all programs created by the coach
router.get('/programs', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
  try {
    const programs = await Program.findAll({ where: { coachId: req.user.id } });
    res.status(200).json(programs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching programs', error: err });
  }
});

module.exports = router;
