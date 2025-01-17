const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Program creator (coach)
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users assigned to this program
  exercises: [
    {
      name: { type: String, required: true },
      repetitions: { type: Number },
      duration: { type: String }, // Example: "30 mins"
    },
  ],
  completionRates: [{ userId: mongoose.Schema.Types.ObjectId, rate: Number }], // Completion rates per user
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Program', ProgramSchema);
