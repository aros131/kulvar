const mongoose = require("mongoose");

const CalendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional for client-specific events
  type: { type: String, enum: ["workout", "reminder", "check-in"], required: true },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { type: String }, // e.g., "daily", "weekly"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);
