const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["coach", "user"], required: true },
  specialization: { type: String }, // Optional field for coaches
  fitnessGoals: { type: String }, // Optional field for users
  profilePicture: {
    type: String,
   default: "/images/default-user.jpg",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
