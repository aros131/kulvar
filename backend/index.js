// backend/index.js
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

/* ------------------------------ Route imports ------------------------------ */
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
import meRoutes from "./routes/meRoutes.js";

/* --------------------------------- Setup ---------------------------------- */
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());

/* ------------------------ CORS: allow ALL (TEST MODE) ---------------------- */
/* NOTE: Do NOT set Allow-Credentials with "*" */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ------------------------------ DB connect -------------------------------- */
if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI in environment.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, { // Mongoose v7+ ignores deprecated opts
    dbName: process.env.MONGO_DB || undefined,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* --------------------------------- Routes --------------------------------- */
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/content", contentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/dashboard/notifications", notificationRoutes); // if needed both
app.use("/exercise-templates", exerciseTemplateRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/groups", clientGroupRoutes);
app.use("/profile", profileRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/programs", programRoutes);
app.use("/coaches", coachRoutes);      // GET /coaches, /coaches/:id, ...
app.use("/progress", progressRoutes);
app.use("/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/events", eventRoutes);
app.use("/me", meRoutes);

/* --------------------------------- Health --------------------------------- */
app.get("/", (_req, res) => res.send("Welcome to the backend API!"));

/* ------------------------------ 404 handler -------------------------------- */
app.use((req, res) => {
  // keep CORS headers on 404
  res.header("Access-Control-Allow-Origin", "*");
  res.status(404).json({ message: "Not found" });
});

/* ---------------------------- Error handler (500) -------------------------- */
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  // keep CORS headers on errors
  res.header("Access-Control-Allow-Origin", "*");
  res.status(err.status || 500).json({ message: "Server error" });
});

/* --------------------------------- Start ---------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
