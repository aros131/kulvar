// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startUtc:{ type: Date, required: true, index: true },
    endUtc:  { type: Date, required: true },

    meetingMode: { type: String, enum: ["in_person", "zoom"], required: true },

    // Pick one spelling and use it everywhere (BE + FE). Here I'll use American spelling:
    status: { type: String, enum: ["pending", "confirmed", "declined", "expired", "canceled"], default: "pending", index: true },

    // only for pending holds; will be set/cleared in hook below
    holdUntil: { type: Date, default: null },

    notes: String,
    location: String,
    zoomJoinUrl: String,
    zoomStartUrl: String,
  },
  { timestamps: true }
);

// Unique for identical slot *when active* (pending/confirmed)
// NOTE: This only covers "same start/end". Overlap checks still happen in code (see route).
BookingSchema.index(
  { coachId: 1, startUtc: 1, endUtc: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);
// in models/Booking.js, after schema:
BookingSchema.index({ holdUntil: 1 }, { expireAfterSeconds: 0 });
// and ensure you ONLY set holdUntil for status === "pending"

// TTL: auto-delete expired pending holds (only docs with non-null holdUntil are affected)
BookingSchema.index({ holdUntil: 1 }, { expireAfterSeconds: 0 });

// Ensure holdUntil is present ONLY for pending
BookingSchema.pre("validate", function (next) {
  // use function(){} for correct 'this' binding
  if (this.status === "pending") {
    if (!this.holdUntil) {
      this.holdUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }
  } else {
    this.holdUntil = null; // prevent TTL from deleting non-pending docs
  }
  next();
});

export default mongoose.model("Booking", BookingSchema);
