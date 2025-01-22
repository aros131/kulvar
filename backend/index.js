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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
console.log(process.env.MONGO_URI);

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contentRoutes = require('./routes/contentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const exerciseTemplateRoutes = require("./routes/exerciseTemplateRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const clientGroupRoutes = require("./routes/clientGroupRoutes");
console.log(authRoutes);
console.log(dashboardRoutes);
console.log(contentRoutes);
console.log(notificationRoutes);
console.log(exerciseTemplateRoutes);
console.log(feedbackRoutes);
console.log(clientGroupRoutes);

// API Endpoints
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/content', contentRoutes);
app.use('/notifications', notificationRoutes);
app.use("/exercise-templates", exerciseTemplateRoutes); 
app.use("/feedback", feedbackRoutes);
app.use("/groups", clientGroupRoutes);
module.exports = router;
console.log("Auth routes loaded");
console.log("Dashboard routes loaded");
console.log("Content routes loaded");
console.log("Notification routes loaded");
console.log("Exercise template routes loaded");
console.log("Feedback routes loaded");
console.log("Client group routes loaded");

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});
