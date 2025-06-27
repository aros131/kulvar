const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /coaches - returns only users with role 'coach'
router.get('/', async (req, res) => {
  const specialization = req.query.specialization;

  try {
    const allowedSpecializations = ['beslenme', 'yoga', 'fitness', 'pilates'];

    const query = {
      role: 'coach',
      specialization: { $in: allowedSpecializations },
    };

    if (specialization && specialization !== 'all') {
      // Filter for the specific specialization only
      query.specialization = specialization;
    }

    const coaches = await User.find(query);
    res.json(coaches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



