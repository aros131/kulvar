const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  dayNumber: { type: Number, required: true }, // Day 1, Day 2, etc.
  completedExercises: [
    {
      name: { type: String },
      setsCompleted: { type: Number },
      notes: { type: String }, // Optional user feedback on the exercise
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Progress", ProgressSchema);
