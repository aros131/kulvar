const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ID'si
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true }, // Program ID

  // ✅ NEW FIELD: total days completed
  daysCompleted: { type: Number, default: 0 }, // Tracks total completed days

  completedSessions: [
    {
      sessionId: { type: String },
      completed: { type: Boolean, default: false },
      dateCompleted: { type: Date },
      fatigueLevel: { type: String, enum: ["Düşük", "Normal", "Yüksek"], default: "Normal" },
    },
  ],

  progressMetrics: [
    {
      metricName: { type: String },
      unit: { type: String },
      values: [{ value: { type: Number }, date: { type: Date, default: Date.now } }],
    },
  ],

  progressiveOverload: [
    {
      exerciseName: { type: String },
      initialWeight: { type: Number },
      currentWeight: { type: Number },
      improvement: { type: Number },
      repsCompleted: { type: Number },
      date: { type: Date, default: Date.now },
    },
  ],

  missedWorkouts: [
    {
      missedDay: { type: Date },
      rescheduledDay: { type: Date },
    },
  ],

  adaptiveAdjustments: [
    {
      exerciseName: { type: String },
      fatigueLevel: { type: String, enum: ["Düşük", "Normal", "Yüksek"] },
      suggestedWeightIncrease: { type: Number, default: 0 },
      suggestedRepsIncrease: { type: Number, default: 0 },
    },
  ],

  goalTracking: {
    initialMetric: { type: Number },
    targetMetric: { type: Number },
    currentMetric: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
  },

  achievementBadges: [
    {
      badge: { type: String },
      dateEarned: { type: Date, default: Date.now },
    },
  ],

  sessionNotes: [
    {
      sessionId: { type: String },
      note: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  streakTracking: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },

  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Progress", ProgressSchema);
