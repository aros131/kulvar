import { onRequest } from 'firebase-functions/v2/https'; // Firebase v2 HTTP
import { initializeApp } from 'firebase-admin/app'; // Firebase Admin initialization
import express from 'express'; // Import Express
import mongoose from 'mongoose'; // MongoDB
import cors from 'cors'; // Enable CORS
import path, { dirname } from 'path'; // Path for static files
import { fileURLToPath } from 'url'; // For ES Modules compatibility
import dotenv from 'dotenv'; // Load environment variables

dotenv.config(); // Load environment variables from .env
initializeApp(); // Initialize Firebase Admin

// Import your route files
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

// Initialize Express
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin); // Dynamically reflect allowed origin
  },
  credentials: true, // Allow cookies/headers
}));

// Parse incoming requests with JSON payloads
app.use(express.json());

// MongoDB Connection (ensure .env has MONGO_URI set)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Add your routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/content', contentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/dashboard/notifications", notificationRoutes);

app.use('/exercise-templates', exerciseTemplateRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/groups', clientGroupRoutes);
app.use('/profile', profileRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/programs', programRoutes);
app.use('/coaches', coachRoutes);
app.use("/progress", progressRoutes);
app.use("/users", userRoutes);
app.use("/uploads", express.static(path.join(dirname(fileURLToPath(import.meta.url)), "uploads")));

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Export Express app as Firebase Function using v2 API
export const api = onRequest(app);

// Start the server
// app.listen(5001, () => { console.log("Server running on http://localhost:5001"); });
