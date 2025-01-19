const mongoose = require("mongoose");

const CalendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);
