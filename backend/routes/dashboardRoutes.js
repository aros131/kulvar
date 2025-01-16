const express = require('express');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { User } = require('../models');
const router = express.Router(); // Initialize the router object


// Serve User Dashboard
router.get('/user', authMiddleware, roleMiddleware(['user']), (req, res) => {
  res.sendFile(path.join(__dirname, '../user_dashboard.html')); // Update path if necessary
});

// Serve Coach Dashboard
router.get('/coach', authMiddleware, roleMiddleware(['coach']), (req, res) => {
  res.sendFile(path.join(__dirname, '../coach_dashboard.html')); // Update path if necessary
});

module.exports = router;

// Get user's profile
router.get('/profile', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err });
  }
});

// Update user's profile
router.put('/profile', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err });
  }
});
// Example data for programs and notifications
const examplePrograms = [
  {
    name: 'Fitness Başlangıç Programı',
    progress: 30,
    tasks: [
      { name: 'Isınma Egzersizleri (10dk)', completed: false },
      { name: 'Kardiyo (15dk)', completed: true },
      { name: 'Kuvvet Çalışması (20dk)', completed: false },
    ],
  },
];

const exampleNotifications = [
  'Yeni bir program eklediniz.',
  'Kardiyo görevinde %50 tamamlandınız.',
  'Hedeflerinize çok yaklaştınız, devam edin!',
];

// User Dashboard Data
router.get('/api/user/programs', authMiddleware, (req, res) => {
  res.json({ programs: examplePrograms });
});

router.get('/api/user/notifications', authMiddleware, (req, res) => {
  res.json({ notifications: exampleNotifications });
});

module.exports = router;
