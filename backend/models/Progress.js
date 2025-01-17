const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  date: { type: Date, required: true },
  completedExercises: [{ type: String }], // Names of completed exercises
  notes: { type: String }, // Optional notes from the user
});

module.exports = mongoose.model('Progress', ProgressSchema);
