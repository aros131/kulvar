const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["video", "image", "document"], required: true },
  fileUrl: { type: String, required: true },
  category: { type: String }, // e.g., "Strength Training"
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Content", ContentSchema);
