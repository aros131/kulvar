const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["coach", "user"], required: true },
  specialization: { type: String }, // For coaches (e.g., "Strength Training")
  fitnessGoals: { type: String },  // For users (e.g., "Lose weight")
  profilePicture: { type: String }, // URL of the profile picture
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
