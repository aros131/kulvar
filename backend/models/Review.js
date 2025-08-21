// models/Review.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Optional linkage if a review is about a specific program
    programId: { type: Schema.Types.ObjectId, ref: "Program" },

    rating:  { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },

    // For keyword chips like “nutrition”, “mobility”, etc.
    keywords: { type: [String], default: [] },

    // Mark if you verified the reviewer was a real client
    verified: { type: Boolean, default: false },

    // Lightweight engagement (can be incremented via $inc)
    helpfulCount:  { type: Number, min: 0, default: 0 },
    reportedCount: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Fast list-by-coach, newest first
ReviewSchema.index({ coachId: 1, _id: -1 });
// Optional: filter/sort by rating efficiently
ReviewSchema.index({ coachId: 1, rating: -1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
