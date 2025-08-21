// models/Follow.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const FollowSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
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

// Prevent duplicates (one follow per user/coach)
FollowSchema.index({ userId: 1, coachId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model("Follow", FollowSchema);
