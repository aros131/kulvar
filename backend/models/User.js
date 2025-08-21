// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    role: { type: String, enum: ["coach", "user"], required: true, index: true },

    // String OR [String] (backward compatible)
    specialization: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
      set: (v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string") {
          return v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      },
    },

    fitnessGoals: { type: String },

    profilePicture: { type: String, default: "/images/default-user.jpg" },
    avatar: { type: String, default: "" }, // prefer this in UI; fallback to profilePicture

    city: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    programsCount: { type: Number, default: 0 },

    // ➕ new (used by profile UI later; harmless if empty)
    tagline: { type: String, default: "" },
    certifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("id").get(function () {
  return this._id.toString();
});

// Helpful indexes
UserSchema.index({ name: "text", city: "text" });
UserSchema.index({ role: 1, rating: -1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
