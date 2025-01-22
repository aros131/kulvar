const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // In days
  days: [
    {
      dayNumber: { type: Number, required: true }, // Day 1, Day 2, etc.
      exercises: [
        {
          name: { type: String, required: true },
          repetitions: { type: Number },
          duration: { type: String }, // e.g., "30 minutes"
          demoLink: { type: String }, // Video or image URL for the exercise
        },
      ],
    },
  ],
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedClients: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completionRate: { type: Number, default: 0 }, // % of program completed
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Program", ProgramSchema);
