const express = require('express');
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

require('dotenv').config();

const app = express();
app.use(express.json());

// Import routes (relative to index.js location)
const authRoutes = require('./auth');

// Use routes
app.use('/api/auth', authRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.send('API is working!');
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
