// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startUtc:{ type: Date, required: true, index: true },
    endUtc:  { type: Date, required: true },

    meetingMode: { type: String, enum: ["in_person", "zoom"], required: true },
    status: { type: String, enum: ["pending", "confirmed", "declined", "expired", "cancelled"], default: "pending", index: true },
    // We "hold" the slot while pending; after this time we consider it expired (and reopen)
    holdUntil: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24h hold (tweakable)

    notes: String,
    location: String,      // optional for "yüz yüze"
    zoomJoinUrl: String,   // (phase 2: integrate Zoom)
    zoomStartUrl: String,  // (phase 2)
  },
  { timestamps: true }
);

// Ensure only ONE pending/confirmed booking per slot:
BookingSchema.index(
  { coachId: 1, startUtc: 1, endUtc: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export default mongoose.model("Booking", BookingSchema);
