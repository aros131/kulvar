// functions/index.js (ESM, pure JS)

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions, defineSecret } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

// ----- Global options (pick your region) -----
setGlobalOptions({
  region: 'us-central1',
  memory: '512MiB',
  concurrency: 80,
});

// ----- Secrets (prod) -----
const MONGO_URI = defineSecret('MONGO_URI');

// ----- Emulators: allow .env for local only -----
if (process.env.FUNCTIONS_EMULATOR) {
  const dotenv = await import('dotenv');
  dotenv.config();
}

initializeApp();

const app = express();

// ----- CORS (tight whitelist recommended) -----
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  // add your deploy domains here:
  // 'https://persecoaching.vercel.app',
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman
      cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json());

// ----- Mongoose connection cache (no TS types here) -----
let connPromise = null;

async function ensureMongoose() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connPromise) {
    // local vs prod secret
    const uri =
      process.env.FUNCTIONS_EMULATOR && process.env.MONGO_URI
        ? process.env.MONGO_URI
        : MONGO_URI.value(); // no "as string" needed in JS

    connPromise = mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    });
  }
  await connPromise;
  return mongoose;
}

// ----- Routes (imports must be JS files) -----
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

// Gate DB usage so first request ensures connection
app.use(async (_req, _res, next) => {
  try {
    await ensureMongoose();
    next();
  } catch (err) {
    next(err);
  }
});

// Mount routers
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/content', contentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/dashboard/notifications', notificationRoutes);
app.use('/exercise-templates', exerciseTemplateRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/groups', clientGroupRoutes);
app.use('/profile', profileRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/programs', programRoutes);
app.use('/coaches', coachRoutes);
app.use('/progress', progressRoutes);
app.use('/users', userRoutes);

// Avoid using uploads folder in Functions FS (use Cloud Storage instead)
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (_req, res) => {
  res.send('Welcome to the backend API!');
});

// Export function with secret
export const api = onRequest({ secrets: [MONGO_URI] }, app);
