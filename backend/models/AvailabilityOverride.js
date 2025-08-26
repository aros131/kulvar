// models/AvailabilityOverride.js (ESM)
import mongoose from "mongoose";
const AvailabilityOverrideSchema = new mongoose.Schema({
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date:    { type: String, required: true }, // "YYYY-MM-DD" in coach's tz
  kind:    { type: String, enum: ["open","closed"], required: true },
  intervals: [{ startMin: Number, endMin: Number }], // only for "open"
});
AvailabilityOverrideSchema.index({ coachId: 1, date: 1 }, { unique: true });
export default mongoose.model("AvailabilityOverride", AvailabilityOverrideSchema);
