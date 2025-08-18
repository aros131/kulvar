// models/Coach.js
import mongoose from 'mongoose';

const CoachSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['coach'], default: 'coach', index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, index: true },
    specialization: { type: String, index: true }, // e.g. fitness | yoga | beslenme | pilates
    profilePicture: String,

    // Optional marketplace fields used by your UI:
    rating: { type: Number, min: 0, max: 5, index: true },   // average rating
    reviewCount: { type: Number, default: 0 },
    priceFrom: { type: Number, index: true },                // ₺ starting price / session
    isOnline: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    languages: { type: [String], index: true },              // ['TR','EN',...]

    bio: { type: String },
    tags: { type: [String], index: true },
  },
  { timestamps: true }
);

// Full-text search (Turkish stemming)
CoachSchema.index(
  { name: 'text', bio: 'text', tags: 'text' },
  { default_language: 'turkish' }
);

// Common compound indexes (optional but helpful)
// CoachSchema.index({ specialization: 1, rating: -1 });
// CoachSchema.index({ specialization: 1, priceFrom: 1 });

const Coach = mongoose.model('Coach', CoachSchema);
export default Coach;
