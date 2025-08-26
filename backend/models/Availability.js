import mongoose from "mongoose";

const RuleSchema = new mongoose.Schema(
  {
    weekdays: { type: [Number], required: true }, // 0..6  (Sun..Sat)
    startMin: { type: Number, required: true },   // minutes from midnight
    endMin:   { type: Number, required: true },
    stepMin:  { type: Number, required: true, default: 30 },
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    rules:   { type: [RuleSchema], default: [] },
    timezone:{ type: String, default: "Europe/Istanbul" },
  },
  { timestamps: true }
);

export default mongoose.model("Availability", AvailabilitySchema);
