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
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import progressPhotoRoutes from "./routes/progressPhotoRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import checkInRoutes from "./routes/checkInRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { startBookingReminderJob } from "./services/bookingReminderJob.js";
import { startWeeklyReportJob } from "./services/weeklyReportJob.js";
import rateLimit from "express-rate-limit";
/* --------------------------------- Setup ---------------------------------- */
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin." },
});
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(express.urlencoded({ extended: true })); // needed for iyzico's checkout form callback POST

/* ------------------------ CORS: allow ALL (TEST MODE) ---------------------- */
/* Reflects the request Origin (so credentials can work) */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin) {
    // Reflect the exact Origin (so credentialed requests are allowed)
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true"); // only if you intend to allow cookies/credentials
  } else {
    // No Origin header (e.g., curl/Postman) — '*' is fine here
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Echo requested headers when present to satisfy preflight
  const reqHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    reqHeaders || "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  // Optional QoL: cache preflight for 10m
  res.setHeader("Access-Control-Max-Age", "600");
}

app.use((req, res, next) => {
  setCorsHeaders(req, res);
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
app.use("/auth", authLimiter, authRoutes);
app.use(generalLimiter);
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
app.use("/media", mediaRoutes);
app.use("/progress-photos", progressPhotoRoutes);
app.use("/habits", habitRoutes);
app.use("/check-ins", checkInRoutes);
app.use("/exercises", exerciseRoutes);
app.use("/ai", aiRoutes);
app.use("/events", eventRoutes);
app.use("/me", meRoutes);
app.use("/payment", paymentRoutes);
app.use("/reports", reportRoutes);
app.use("/admin", adminRoutes);
app.use("/dashboard", availabilityRoutes);
app.use("/", availabilityRoutes);
app.use("/", bookingRoutes);
/* --------------------------------- Health --------------------------------- */
app.get("/", (_req, res) => res.send("Welcome to the backend API!"));

/* ------------------------------ 404 handler -------------------------------- */
app.use((req, res) => {
  setCorsHeaders(req, res);
  res.status(404).json({ message: "Not found" });
});

/* ---------------------------- Error handler (500) -------------------------- */
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  setCorsHeaders(req, res);
  res.status(err.status || 500).json({ message: "Server error" });
});


/* --------------------------------- Start ---------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startBookingReminderJob();
  startWeeklyReportJob();
});
