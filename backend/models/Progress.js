import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ID'si
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true }, // Program ID

  // ✅ NEW FIELD: total days completed
  daysCompleted: { type: Number, default: 0 }, // Tracks total completed days

  // Recomputed on every completed session (completedSessions.length / totalSessions).
  // Without this field, the value the controller computes was silently dropped on save
  // (not declared in the schema) and /progress/all-program-progress always reported 0%.
  progressPercentage: { type: Number, default: 0 },

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

export default mongoose.model("Progress", ProgressSchema);
