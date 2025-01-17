const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  progress: { type: String, default: '0%' },
  tasks: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
