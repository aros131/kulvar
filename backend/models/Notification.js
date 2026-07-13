import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "reminder",
      "program_update",
      "feedback",
      "booking_request",
      "booking_approved",
      "booking_declined",
      "booking_cancelled",
      "booking_completed",
    ],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
