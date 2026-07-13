import User from '../models/User.js';

// Fetch Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      specialization: user.specialization,
      fitnessGoals: user.fitnessGoals,
      bio: user.bio,
      tagline: user.tagline,
      certifications: user.certifications,
      city: user.city,
      onboardingCompleted: user.onboardingCompleted,
      notificationPreferences: user.notificationPreferences,
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

    const allowedUpdates = ["name", "profilePicture", "specialization", "fitnessGoals", "bio", "tagline", "certifications", "city"];
    const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
      if (allowedUpdates.includes(key)) {
        acc[key] = updates[key];
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
