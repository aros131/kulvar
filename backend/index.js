import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import exerciseTemplateRoutes from "./routes/exerciseTemplateRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import clientGroupRoutes from "./routes/clientGroupRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import programRoutes from "./routes/programRoutes.js";
import coachRoutes from './routes/coachRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // ✅ allows all origins
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
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
