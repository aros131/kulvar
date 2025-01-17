const express = require('express');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Serve User Dashboard
router.get('/user', authMiddleware, roleMiddleware(['user']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/user_dashboard.html'));
});

// Serve Coach Dashboard
router.get('/coach', authMiddleware, roleMiddleware(['coach']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/coach_dashboard.html'));
});
router.get('/user/data', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    // Fetch user-specific data (replace with your data model)
    router.get('/user/data', authMiddleware, roleMiddleware(['user']), async (req, res) => {
      try {
        const Program = require('../models/Program'); // Import the Program model

router.get('/user/data', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    // Fetch programs for the authenticated user
    const programs = await Program.find({ userId: req.user.id });

    res.status(200).json({
      name: req.user.name,
      programs: programs.map((program) => ({
        title: program.title,
        progress: program.progress,
        tasks: program.tasks,
      })),
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

    
    // Fetch coach-specific data 
    router.get('/coach/profile', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
      try {
        const coach = await User.findById(req.user.id).select('-password');
        if (!coach) {
          return res.status(404).json({ message: 'Coach not found' });
        }
    
        res.status(200).json({
          name: coach.name,
          email: coach.email,
        });
      } catch (err) {
        console.error('Error fetching coach profile:', err);
        res.status(500).json({ message: 'Failed to fetch coach profile' });
      }
    });
    

module.exports = router;
