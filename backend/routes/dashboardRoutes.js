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
    const data = {
      name: req.user.name,
      programs: [
        { title: 'Fitness Program 1', progress: '30%' },
        { title: 'Cardio Program', progress: '50%' },
      ],
    };
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});
router.get('/coach/data', authMiddleware, roleMiddleware(['coach']), async (req, res) => {
  try {
    // Fetch coach-specific data (replace with your data model)
    const data = {
      name: req.user.name,
      clients: [
        { name: 'John Doe', program: 'Fitness Program 1' },
        { name: 'Jane Smith', program: 'Weight Loss Plan' },
      ],
    };
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching coach data:', err);
    res.status(500).json({ message: 'Failed to fetch coach data' });
  }
});

module.exports = router;
