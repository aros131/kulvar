const express = require('express');
const router = express.Router(); 
const { verifyToken, verifyRole } = require('../middleware/auth');

// Example: Admin-only Route
router.get('/admin-only', verifyToken, verifyRole('admin'), (req, res) => {
  res.send('Welcome, Admin!');
});

// Example: Coach-only Route
router.get('/coach-only', verifyToken, verifyRole('coach'), (req, res) => {
  res.send('Welcome, Coach!');
});


router.get('/', (req, res) => {
  res.send('Auth route is working!');
});


module.exports = router;


module.exports = router;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');


// Sign Up Route
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
