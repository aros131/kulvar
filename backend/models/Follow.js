import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicates
FollowSchema.index({ userId: 1, coachId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model("Follow", FollowSchema);
