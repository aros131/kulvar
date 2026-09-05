// models/AvailabilityBlackout.js (ESM)
import mongoose from "mongoose";
const AvailabilityBlackoutSchema = new mongoose.Schema({
  coachId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startDate: { type: String, required: true }, // "YYYY-MM-DD" local
  endDate:   { type: String, required: true }, // inclusive
});
AvailabilityBlackoutSchema.index({ coachId: 1, startDate: 1, endDate: 1 });
export default mongoose.model("AvailabilityBlackout", AvailabilityBlackoutSchema);
