import User from '../models/User.js';
import CheckIn from '../models/CheckIn.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = (process.env.BASE_URL || process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');

// Fetch Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Current weight isn't a field on User — it's whatever was logged most
    // recently in a check-in, so the weight-goal progress bar reflects real
    // activity instead of a number nobody keeps updated.
    let currentWeight = null;
    if (user.role === "user") {
      const lastCheckIn = await CheckIn.findOne({ userId: user._id, weight: { $ne: null } })
        .sort({ date: -1 })
        .select("weight date")
        .lean();
      currentWeight = lastCheckIn?.weight ?? null;
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      specialization: user.specialization,
      fitnessGoals: user.fitnessGoals,
      fitnessGoalType: user.fitnessGoalType,
      goalStartWeight: user.goalStartWeight,
      goalTargetWeight: user.goalTargetWeight,
      height: user.height,
      currentWeight,
      fitnessLevel: user.fitnessLevel,
      availableDays: user.availableDays,
      bio: user.bio,
      tagline: user.tagline,
      certifications: user.certifications,
      city: user.city,
      onboardingCompleted: user.onboardingCompleted,
      notificationPreferences: user.notificationPreferences,
      emailVerified: user.emailVerified,
      price: user.price,
      isApproved: user.isApproved,
      isListedCoach: user.isListedCoach,
      brandColor: user.brandColor,
      brandLogoUrl: user.brandLogoUrl,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// Mark onboarding as completed (so the welcome modal doesn't reappear on other devices)
export const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { onboardingCompleted: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ onboardingCompleted: user.onboardingCompleted });
  } catch (error) {
    res.status(500).json({ message: "Error completing onboarding", error: error.message });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { inApp, email } = req.body;
    const update = {};
    if (inApp && typeof inApp === "object") {
      for (const key of ["bookingRequests", "bookingUpdates", "messages", "reviews"]) {
        if (typeof inApp[key] === "boolean") update[`notificationPreferences.inApp.${key}`] = inApp[key];
      }
    }
    if (email && typeof email === "object") {
      for (const key of ["bookingRequests", "bookingUpdates", "messages", "weeklyReport"]) {
        if (typeof email[key] === "boolean") update[`notificationPreferences.email.${key}`] = email[key];
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ notificationPreferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification preferences", error: error.message });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    const allowedUpdates = ["name", "profilePicture", "specialization", "fitnessGoals", "fitnessGoalType", "goalStartWeight", "goalTargetWeight", "height", "fitnessLevel", "availableDays", "bio", "tagline", "certifications", "city", "price", "isListedCoach", "brandColor", "brandLogoUrl"];
    const numericFields = ["goalStartWeight", "goalTargetWeight", "height"];
    const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
      if (allowedUpdates.includes(key)) {
        let value = updates[key];
        if (numericFields.includes(key)) {
          value = value === "" || value === null || value === undefined ? null : Number(value);
          if (Number.isNaN(value)) value = null;
        }
        acc[key] = value;
      }
      return acc;
    }, {});

    const user = await User.findByIdAndUpdate(req.user._id, filteredUpdates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        specialization: user.specialization,
        fitnessGoals: user.fitnessGoals,
        fitnessGoalType: user.fitnessGoalType,
        goalStartWeight: user.goalStartWeight,
        goalTargetWeight: user.goalTargetWeight,
        height: user.height,
        fitnessLevel: user.fitnessLevel,
        availableDays: user.availableDays,
        bio: user.bio,
        tagline: user.tagline,
        certifications: user.certifications,
        city: user.city,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// POST /profile/avatar — multer uploads to uploads/avatars/
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `${BASE_URL}/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profilePicture: url });
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
};
