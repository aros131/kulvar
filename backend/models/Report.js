const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // e.g., "Progress", "Engagement"
  filters: { type: mongoose.Schema.Types.Mixed }, // Dynamic filters applied during report generation
  data: { type: mongoose.Schema.Types.Mixed }, // Actual report data
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", ReportSchema);
