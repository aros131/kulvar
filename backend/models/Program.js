const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // Duration in weeks
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Linked coach
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Clients assigned to this program
  difficulty: { type: String, enum: ["Başlangıç", "Orta Düzey", "İleri Seviye"], default: "Başlangıç" }, // NEW

  dailySchedule: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      goals: { type: String }, // Overall goal for the day
      exercises: [
        {
          name: { type: String, required: true },
          sets: { type: Number, default: 0 },
          reps: { type: Number, default: 0 },
          duration: { type: Number, default: 0 }, // In minutes
          videoUrl: { type: String }, // Optional video
          notes: { type: String }, // Additional instructions
        },
      ],
    },
  ],

  nutritionPlan: {
    tips: [{ type: String }], // Array of nutrition tips
    meals: [
      {
        name: { type: String }, // Meal name (e.g., "Breakfast")
        description: { type: String }, // What to eat
        time: { type: String }, // Suggested time (e.g., "08:00 AM")
      },
    ],
  },

  documents: [
    {
      name: { type: String }, // Document name (e.g., "Weekly Plan")
      url: { type: String }, // Link to document (PDFs, etc.)
    },
  ],

  feedback: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      feedbackText: { type: String },
      rating: { type: Number, min: 1, max: 5 }, // Client rating
      date: { type: Date, default: Date.now },
    },
  ],

  progressTracking: {
    metrics: [
      {
        name: { type: String, required: true }, // Metric name (e.g., "Weight")
        unit: { type: String }, // Unit of measurement (e.g., "kg")
        values: [
          {
            value: { type: Number, required: true },
            date: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },

  completedDays: [ // NEW ✅
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      day: { type: String }, // e.g., "Monday"
      completed: { type: Boolean, default: false },
      dateCompleted: { type: Date },
    },
  ],

  visibility: { type: String, enum: ["public", "private"], default: "private" }, // NEW ✅

  // ✅ NEW: Custom Workout Schedules
  scheduleType: { type: String, enum: ["Fixed", "Custom"], default: "Fixed" },
  customSchedule: [
    {
      day: { type: String }, // Example: "Monday, Wednesday, Friday"
      workout: { type: String } // Example: "Upper Body Strength"
    }
  ],

  // ✅ NEW: Progressive Overload (Tracking Improvements)
  progressiveOverload: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      exerciseName: { type: String },
      initialWeight: { type: Number }, // e.g., 50 kg
      currentWeight: { type: Number }, // e.g., 60 kg
      improvement: { type: Number }, // e.g., +10 kg
    }
  ],

  // ✅ NEW: Session-Based Tracking
  sessionTracking: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sessionId: { type: String }, // Unique session identifier
      completed: { type: Boolean, default: false },
      feedback: { type: String }, // Client comments on the session
      dateCompleted: { type: Date },
    }
  ],

  // ✅ NEW: Private Notes for Coaches
  privateNotes: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
});



module.exports = mongoose.model("Program", ProgramSchema);
