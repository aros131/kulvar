const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'coach'], required: true }, // 'user' or 'coach'
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function () { return this.role === 'user'; } }, // User's coach
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
