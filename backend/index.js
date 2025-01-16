const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files (CSS, JS, etc.) from the "kulvar" root directory
app.use(express.static(path.join(__dirname, '..')));

// Route to serve the User Dashboard
app.get('/dashboard/user', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'user_dashboard.html'));
});

// Route to serve the Coach Dashboard
app.get('/dashboard/coach', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'coach_dashboard.html'));
});

// Import API routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Register API routes
app.use('/auth', authRoutes);
app.use('/api', dashboardRoutes);

// Default route (health check)
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
