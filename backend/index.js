const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express(); // ✅ Now app is defined

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://aros131.github.io',
  credentials: true
}));
app.use(express.json());

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
const exerciseTemplateRoutes = require("./routes/exerciseTemplateRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const clientGroupRoutes = require("./routes/clientGroupRoutes");
const profileRoutes = require("./routes/profileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const programRoutes = require("./routes/programRoutes");
const coachRoutes = require('./routes/coachRoutes');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/content', contentRoutes);
app.use('/notifications', notificationRoutes);
app.use("/exercise-templates", exerciseTemplateRoutes); 
app.use("/feedback", feedbackRoutes);
app.use("/groups", clientGroupRoutes);
app.use("/profile", profileRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/programs", programRoutes);
app.use('/coaches', coachRoutes);
// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
