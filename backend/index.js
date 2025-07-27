import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Route imports
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import exerciseTemplateRoutes from './routes/exerciseTemplateRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import clientGroupRoutes from './routes/clientGroupRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import programRoutes from './routes/programRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import userRoutes from './routes/userRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin); // ✅ dynamically reflect allowed origin
  },
  credentials: true // ✅ allow cookies/headers
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
app.use("/notifications", notificationRoutes); // 🔁 Eski kullanıcı bildirimleri için
app.use("/dashboard/notifications", notificationRoutes); // 🔁 Koç paneli için uyumlu

app.use('/exercise-templates', exerciseTemplateRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/groups', clientGroupRoutes);
app.use('/profile', profileRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/programs', programRoutes);
app.use('/coaches', coachRoutes);
app.use("/progress", progressRoutes);
app.use("/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
