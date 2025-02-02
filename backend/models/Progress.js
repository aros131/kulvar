const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  completedDays: [
    {
      day: { type: String, required: true },
      completed: { type: Boolean, default: false },
      dateCompleted: { type: Date },
    },
  ],
  progressiveOverload: [
    {
      exerciseName: { type: String },
      initialWeight: { type: Number },
      currentWeight: { type: Number },
      improvement: { type: Number },
    },
  ],
  sessionTracking: [
    {
      sessionId: { type: String },
      completed: { type: Boolean, default: false },
      feedback: { type: String },
      dateCompleted: { type: Date },
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Progress", ProgressSchema);
