const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // Duration in weeks
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Linked coach
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Clients assigned to this program
  dailySchedule: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      goals: { type: String }, // Overall goal for the day (e.g., "Strength Training")
      exercises: [
        {
          name: { type: String, required: true }, // Exercise name
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
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Program", ProgramSchema);
