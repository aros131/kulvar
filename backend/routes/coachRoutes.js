const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { Program } = require('../models');

const router = express.Router();

// Test Route
router.get('/test', (req, res) => {
  res.status(200).send('Coach routes are working!');
});

// Create a program
router.post('/programs', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !description || !price) {
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const program = await Program.create({
      name, // Correct field mapping
      description,
      price,
      createdBy: req.user.id,
    });
  
    res.status(201).json({ message: 'Program created successfully', program });
  } catch (err) {
    res.status(500).json({ message: 'Error creating program', error: err });
  }
}});

// Get all programs created by the coach
router.get('/programs', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
  try {
    const programs = await Program.findAll({ where: { createdBy: req.user.id } });
    res.status(200).json(programs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching programs', error: err });
  }
});

module.exports = router;



