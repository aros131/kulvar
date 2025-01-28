const Program = require("../models/Program");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Progress = require("../models/Progress");

// Get clients for a coach
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ coachId: req.user.id, role: "user" });
    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error retrieving clients:", error.message);
    res.status(500).json({ message: "Error retrieving clients", error: error.message });
  }
};

// Get progress for a specific client
exports.getClientProgress = async (req, res) => {
  try {
    const { id } = req.params; // Client ID
    const progress = await Progress.find({ clientId: id });
    res.status(200).json({ progress });
  } catch (error) {
    console.error("Error retrieving client progress:", error.message);
    res.status(500).json({ message: "Error retrieving client progress", error: error.message });
  }
};

// Save progress for a user
exports.saveProgress = async (req, res) => {
  try {
    const { programId, data } = req.body; // Data may include details like days completed
    const newProgress = await Progress.create({
      programId,
      clientId: req.user.id,
      data,
    });
    res.status(201).json(newProgress);
  } catch (error) {
    console.error("Error saving progress:", error.message);
    res.status(500).json({ message: "Error saving progress", error: error.message });
  }
};


exports.getAnalyticsForCoach = async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ coachId: req.user.id, role: "user" });
    const totalPrograms = await Program.countDocuments({ coachId: req.user.id });

    res.status(200).json({ totalClients, totalPrograms });
  } catch (error) {
    console.error("Error retrieving coach analytics:", error.message);
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};

// Get analytics for a user (programs assigned, progress made)
exports.getAnalyticsForUser = async (req, res) => {
  try {
    const assignedPrograms = await Program.countDocuments({ userId: req.user.id });

    // Calculate progress (assuming there's a "Progress" model that tracks user progress per program)
    const totalProgress = await Progress.aggregate([
      { $match: { clientId: req.user.id } },
      {
        $group: {
          _id: null,
          totalDaysCompleted: { $sum: "$data.daysCompleted" }, // Assuming progress data tracks `daysCompleted`
        },
      },
    ]);

    res.status(200).json({
      assignedPrograms,
      totalDaysCompleted: totalProgress.length > 0 ? totalProgress[0].totalDaysCompleted : 0,
    });
  } catch (error) {
    console.error("Error retrieving user analytics:", error.message);
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};

// Send a notification to a client (Coaches only)
exports.sendNotification = async (req, res) => {
  try {
    const { clientId, message } = req.body;

    // Validate input
    if (!clientId || !message) {
      return res.status(400).json({ message: "Client ID and message are required" });
    }

    // Create the notification
    const notification = await Notification.create({
      clientId,
      coachId: req.user.id, // Coach ID is extracted from the logged-in user
      message,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};

// Get notifications for a coach (Coaches only)
exports.getNotificationsForCoach = async (req, res) => {
  try {
    const notifications = await Notification.find({ coachId: req.user.id });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error retrieving coach notifications:", error.message);
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

// Get notifications for a user (Users only)
exports.getNotificationsForUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ clientId: req.user.id });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error retrieving user notifications:", error.message);
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};


// Get user-specific programs
exports.getUserPrograms = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from token (set by `protect` middleware)

    // Fetch programs assigned to the user
    const programs = await Program.find({ userId });

    if (!programs || programs.length === 0) {
      return res.status(404).json({ message: "No programs found for this user" });
    }

    res.status(200).json({ programs });
  } catch (error) {
    console.error("Error fetching user programs:", error.message);
    res.status(500).json({ message: "Error fetching user programs", error: error.message });
  }
};

// Get groups for a coach (Optional, if needed)
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ coachId: req.user.id });
    res.status(200).json({ groups });
  } catch (error) {
    console.error("Error retrieving groups:", error.message);
    res.status(500).json({ message: "Error retrieving groups", error: error.message });
  }
};
