const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const { User } = require('../models'); // Assuming User model is in models
const router = express.Router();

// ====== PATH: POST /auth/register ======
// Register a new user (coach or user)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role, // 'coach' or 'user'
    });

    // Respond with success message
    res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err });
  }
});

// ====== PATH: POST /auth/login ======
// Log in an existing user and return a JWT token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ====== PATH: GET /auth/me ======
// Get the currently logged-in user's details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }, // Exclude sensitive information
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user details', error: err });
  }
});

// ====== PATH: PUT /auth/update ======
// Update user details (name, email, password)
router.put('/update', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({ message: 'Please provide data to update.' });
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ====== PATH: DELETE /auth/delete ======
// Delete the current user's account
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.destroy();

    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting account.', error: err });
  }
});

module.exports = router;

