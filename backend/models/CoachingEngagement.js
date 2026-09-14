// models/CoachingEngagement.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * CoachingEngagement
 * Tracks an ongoing (usually face-to-face) coaching relationship that is
 * billed on a recurring cadence, separate from one-off Program purchases.
 */
const CoachingEngagementSchema = new Schema(
  {
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    billingType: {
      type: String,
      enum: ["monthly", "weekly", "per_session"],
      required: true,
    },
    rate: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["active", "paused", "ended"],
      default: "active",
      index: true,
    },

    startDate: { type: Date, default: Date.now },

    // Only meaningful for monthly/weekly; null for per_session (billed on booking completion instead).
    nextBillingDate: { type: Date, default: null },

    notes: { type: String },
  },
  { timestamps: true }
);

// Only one active engagement per coach/user pair at a time.
CoachingEngagementSchema.index(
  { coachId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

CoachingEngagementSchema.index({ status: 1, billingType: 1, nextBillingDate: 1 });

export default mongoose.model("CoachingEngagement", CoachingEngagementSchema);
