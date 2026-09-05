// models/AvailabilityRule.js (ESM)
import mongoose from "mongoose";
const AvailabilityRuleSchema = new mongoose.Schema({
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  weekdays: { type: [Number], required: true }, // 0=Sun..6=Sat
  startMin: { type: Number, required: true, min: 0, max: 1439 },
  endMin:   { type: Number, required: true, min: 1,  max: 1440 },
  stepMin:  { type: Number, default: 30 },
});
AvailabilityRuleSchema.index({ coachId: 1, weekdays: 1, startMin: 1, endMin: 1 }, { unique: true });
export default mongoose.model("AvailabilityRule", AvailabilityRuleSchema);
