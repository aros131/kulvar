const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /coaches - returns only users with role 'coach'
router.get('/', async (req, res) => {
  try {
    const coaches = await User.find({ role: 'coach' });
    res.json(coaches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
