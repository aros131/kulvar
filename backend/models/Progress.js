const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  completedDays: [
    {
      day: { type: String }, // e.g., "Monday"
      exercises: [
        {
          name: { type: String },
          completedSets: { type: Number, default: 0 },
          completedReps: { type: Number, default: 0 },
          completedDuration: { type: Number, default: 0 }, 
          isFullyCompleted: { type: Boolean, default: false },
        }
      ],
      dateCompleted: { type: Date },
    }
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
  exerciseCompletion: [
    {
      day: { type: String }, // Example: "Monday"
      exercises: [
        {
          name: { type: String },
          completedSets: { type: Number, default: 0 },
          completedReps: { type: Number, default: 0 },
          completedDuration: { type: Number, default: 0 },
          isFullyCompleted: { type: Boolean, default: false }, // ✅ Track if fully completed
        }
      ]
    }
  ],
  progressiveOverload: [
    {
      exerciseName: { type: String },
      history: [
        {
          date: { type: Date, default: Date.now },
          weight: { type: Number },
          reps: { type: Number },
          duration: { type: Number },
        }
      ],
      improvement: { type: Number }, // Total improvement tracking
    }
  ],
  previousAttempts: [
    {
      startDate: { type: Date },
      endDate: { type: Date },
      completionRate: { type: Number }, // Example: 80% before restarting
    }
  ],
  adaptiveAdjustments: [
    {
      exerciseName: { type: String },
      suggestedWeightIncrease: { type: Number }, // Example: "Increase by 2.5kg"
      suggestedRepsIncrease: { type: Number }, // Example: "Increase by 2 reps"
      fatigueLevel: { type: String, enum: ["Low", "Moderate", "High"], default: "Moderate" },
    }
  ],
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
  },
  weeklySummary: [
    {
      weekNumber: { type: Number },
      workoutsCompleted: { type: Number },
      totalVolumeLifted: { type: Number }, // Example: "5000 kg lifted"
      feedbackSummary: { type: String },
    }
  ],
  monthlySummary: [
    {
      month: { type: String },
      completionRate: { type: Number }, // Example: "85% of sessions completed"
      biggestImprovement: { type: String }, // Example: "Squat +10kg"
    }
  ],
  goalTracking: {
    goalType: { type: String, enum: ["Weight Loss", "Muscle Gain", "Endurance"], required: true },
    initialMetric: { type: Number }, // Example: "Start Weight: 80kg"
    targetMetric: { type: Number }, // Example: "Goal Weight: 75kg"
    currentMetric: { type: Number }, // Example: "Now: 78kg"
    progressPercentage: { type: Number, default: 0 }, // Auto-calculated
  },
  
});
sessionTracking: [
  {
    sessionId: { type: String }, // Unique session identifier
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completed: { type: Boolean, default: false },
    feedback: { type: String }, // Optional feedback for the session
    dateCompleted: { type: Date },
  },
],

module.exports = mongoose.model("Progress", ProgressSchema);
