const mongoose = require("mongoose");
const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Add this
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["reminder", "program_update", "feedback"],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
