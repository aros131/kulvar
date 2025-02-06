const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // Duration in weeks
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Linked coach
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Clients assigned to this program
  difficulty: { type: String, enum: ["Başlangıç", "Orta Düzey", "İleri Seviye"], default: "Başlangıç" },

  // ✅ NEW: Start Date Per Client (Tracking)
  startDate: { type: Date, default: Date.now },

  // ✅ NEW: Overall Program Goal (e.g., "Lose 5kg in 12 weeks")
  targetGoal: { type: String },

  dailySchedule: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      sessions: [
        {
          name: { type: String, required: true }, // e.g., "Morning Cardio"
          completed: { type: Boolean, default: false },
          exercises: [
            {
              name: { type: String, required: true }, // e.g., "Squats"
              sets: { type: Number, default: 0 },
              reps: { type: Number, default: 0 },
              duration: { type: Number, default: 0 }, // in minutes
              videoUrls: [{ type: String }], // Multiple videos per exercise
              completed: { type: Boolean, default: false }, // Optional
            },
          ],
        },
      ],
    },
  ],


  nutritionPlan: {
    tips: [{ type: String }], 
    meals: [
      {
        name: { type: String },
        description: { type: String },
        time: { type: String },
      },
    ],
  },

  documents: [
    {
      name: { type: String },
      url: { type: String },
    },
  ],

  feedback: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      feedbackText: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      date: { type: Date, default: Date.now },
    },
  ],

  progressTracking: {
    metrics: [
      {
        name: { type: String, required: true },
        unit: { type: String },
        values: [
          {
            value: { type: Number, required: true },
            date: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },

  

  // ✅ NEW: Missed Workouts (Clients Can Reschedule)
  missedWorkouts: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      missedDay: { type: String },
      rescheduledDay: { type: String },
    }
  ],

  visibility: { type: String, enum: ["public", "private"], default: "private" },

  scheduleType: { type: String, enum: ["Fixed", "Custom"], default: "Fixed" },
  customSchedule: [
    {
      day: { type: String },
      workout: { type: String }
    }
  ],

  
  sessionTracking: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sessionId: { type: String },
      completed: { type: Boolean, default: false },
      feedback: { type: String },
      dateCompleted: { type: Date },
    }
  ],

  privateNotes: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // ✅ NEW: Program Status (Active, Completed, Paused)
  status: { type: String, enum: ["Active", "Completed", "Paused"], default: "Active" },

  // ✅ NEW: Coach Announcements
  announcements: [
    {
      message: { type: String },
      date: { type: Date, default: Date.now },
    }
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Program", ProgramSchema);
