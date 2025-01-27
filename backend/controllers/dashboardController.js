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
    res.status(500).json({ message: "Error saving progress", error: error.message });
  }
};

// Get analytics for a coach
exports.getAnalytics = async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ coachId: req.user.id, role: "user" });
    const totalPrograms = await Program.countDocuments({ coachId: req.user.id });

    res.status(200).json({ totalClients, totalPrograms });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};

// Send notification to a client
exports.sendNotification = async (req, res) => {
  try {
    const { clientId, message } = req.body;
    const notification = await Notification.create({
      clientId,
      message,
      coachId: req.user.id,
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};

// Get notifications for a coach
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ coachId: req.user.id });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};
