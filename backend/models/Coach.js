// models/Coach.js
import mongoose from 'mongoose';

const CoachSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['coach'], default: 'coach', index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, index: true },
    specialization: { type: String, index: true },
    profilePicture: String,

    // optional, used by UI (safe to keep even if null)
    rating: { type: Number, min: 0, max: 5, index: true },
    priceFrom: { type: Number, index: true },
    isOnline: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    languages: { type: [String], index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Coach', CoachSchema);
