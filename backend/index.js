// backend/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import exerciseTemplateRoutes from "./routes/exerciseTemplateRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import clientGroupRoutes from "./routes/clientGroupRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import programRoutes from "./routes/programRoutes.js";
import coachRoutes from "./routes/coachRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

/* ---------------------------- CORS (TEST MODE) ---------------------------- */
// Echo the request origin (NOT "*"), so credentials & Authorization work.
const corsOptions = {
  origin(origin, cb) {
    // allow SSR/healthchecks without Origin too
    return cb(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Total-Count"],
};

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight for all routes

/* ----------------------------- Body parsing ------------------------------- */
app.use(express.json());

/* ------------------------------ DB connect -------------------------------- */
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* --------------------------------- Routes --------------------------------- */
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/content", contentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/dashboard/notifications", notificationRoutes);
app.use("/exercise-templates", exerciseTemplateRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/groups", clientGroupRoutes);
app.use("/profile", profileRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/programs", programRoutes);
app.use("/coaches", coachRoutes); // GET /coaches, /coaches/:id, etc.
app.use("/progress", progressRoutes);
app.use("/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/events", eventRoutes);

/* --------------------------------- Health --------------------------------- */
app.get("/", (_req, res) => res.send("Welcome to the backend API!"));

/* --------------------------------- Start ---------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
