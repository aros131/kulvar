import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    // user | coach
    role: { type: String, enum: ["coach", "user"], required: true, index: true },

    // You had specialization as String; keep it BUT allow array too.
    // This stays backward-compatible with your existing docs.
    specialization: {
      type: mongoose.Schema.Types.Mixed, // String OR [String]
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

    // Existing for users:
    fitnessGoals: { type: String },

    profilePicture: {
      type: String,
      default: "/images/default-user.jpg",
    },

    // NEW (optional) fields that the coaches list uses:
    avatar: { type: String, default: "" }, // alias-ish, some UIs use avatar
    city: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    programsCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Hide sensitive / noisy fields
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Helpful text index for search (name/city/specialization stringified)
UserSchema.index({ name: "text", city: "text" });

export default mongoose.models.User || mongoose.model("User", UserSchema);
