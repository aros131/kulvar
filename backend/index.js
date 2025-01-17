const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contentRoutes = require('./routes/contentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// API Endpoints
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/content', contentRoutes);
app.use('/notifications', notificationRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
