const Program = require("../models/Program");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Progress = require("../models/Progress");
const Feedback = require("../models/Feedback");

// ✅ Send notification
const sendNotification = async (req, res) => {
  try {
    const { clientId, message, type } = req.body;
    if (!clientId || !message || !type) {
      return res.status(400).json({ message: "Client ID, message, and type are required" });
    }
    const notification = await Notification.create({
      recipientId: clientId,
      message,
      type,
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};

// ✅ Fetch Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      specialization: user.specialization,
      fitnessGoals: user.fitnessGoals,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// ✅ Get all clients for the coach
const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const coachId = req.user.id;
    const query = {
      coachId,
      role: "user",
      name: { $regex: search, $options: "i" },
    };
    const clients = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-password");
    const totalClients = await User.countDocuments(query);
    res.status(200).json({ clients, totalClients });
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients", error: error.message });
  }
};

// ✅ Get details of a specific client
const getClientDetails = async (req, res) => {
  try {
    const client = await User.findById(req.params.id).select("-password");
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: "Error fetching client details", error: error.message });
  }
};

// ✅ Get user programs
const getUserPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ assignedClients: req.user.id });
    if (!programs || programs.length === 0) {
      return res.status(404).json({ message: "No programs found for this user" });
    }
    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user programs", error: error.message });
  }
};

// ✅ Get progress for a specific client
const getClientProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await Progress.find({ clientId: id });
    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving client progress", error: error.message });
  }
};

// ✅ Save progress for a user
const saveProgress = async (req, res) => {
  try {
    const { programId, data } = req.body;
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

// ✅ Get analytics for coach
const getAnalyticsForCoach = async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ coachId: req.user.id, role: "user" });
    const totalPrograms = await Program.countDocuments({ coachId: req.user.id });
    res.status(200).json({ totalClients, totalPrograms });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};

// ✅ Get analytics for user
const getAnalyticsForUser = async (req, res) => {
  try {
    const assignedPrograms = await Program.countDocuments({ assignedClients: req.user.id });
    const totalProgress = await Progress.aggregate([
      { $match: { clientId: req.user.id } },
      {
        $group: {
          _id: null,
          totalDaysCompleted: { $sum: "$data.daysCompleted" },
        },
      },
    ]);
    res.status(200).json({
      assignedPrograms,
      totalDaysCompleted: totalProgress.length > 0 ? totalProgress[0].totalDaysCompleted : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};

// ✅ Get notifications for coach
const getNotificationsForCoach = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id });
    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

// ✅ Get notifications for user
const getNotificationsForUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id });
    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

// ✅ Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: "Error marking notification", error: error.message });
  }
};

// ✅ Get user schedule
const getUserSchedule = async (req, res) => {
  try {
    const programs = await Program.find({ assignedClients: req.user.id });
    if (!programs || programs.length === 0) {
      return res.status(404).json({ message: "No scheduled workouts found" });
    }
    let schedule = [];
    programs.forEach(program => {
      program.dailySchedule.forEach(day => {
        schedule.push({
          programId: program._id,
          programName: program.name,
          day: day.day,
          sessions: day.sessions
        });
      });
    });
    res.status(200).json({ schedule });
  } catch (error) {
    res.status(500).json({ message: "Error fetching workout schedule", error: error.message });
  }
};

// ✅ Get feedbacks
const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ coachId: req.user.id }).populate("clientId", "name email");
    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ message: "No feedbacks found" });
    }
    res.status(200).json({ feedbacks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedbacks", error: error.message });
  }
};

// ✅ Mark feedback as read
const markFeedbackAsRead = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findByIdAndUpdate(feedbackId, { isRead: true }, { new: true });
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json({ feedback });
  } catch (error) {
    res.status(500).json({ message: "Error marking feedback as read", error: error.message });
  }
};

// ✅ Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting feedback", error: error.message });
  }
};

// ✅ Reply to feedback
const replyToFeedback = async (req, res) => {
  try {
    const { feedbackId, message } = req.body;
    const coachId = req.user.id;
    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $push: { replies: { coachId, message, date: new Date() } } },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.status(200).json({ message: "Reply added successfully", feedback });
  } catch (error) {
    res.status(500).json({ message: "Error replying to feedback", error: error.message });
  }
};

// ✅ Get full coach analytics
const getFullCoachAnalytics = async (req, res) => {
  try {
    res.status(200).json({ message: "Full coach analytics works" });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving full coach analytics", error: error.message });
  }
};

// ✅ Get summary coach analytics
const getCoachAnalytics = async (req, res) => {
  try {
    res.status(200).json({ message: "Coach analytics works" });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving coach analytics", error: error.message });
  }
};

// ✅ Final module exports
module.exports = {
  sendNotification,
  getProfile,
  getClients,
  getClientDetails,
  getUserPrograms,
  getClientProgress,
  saveProgress,
  getAnalyticsForCoach,
  getAnalyticsForUser,
  getNotificationsForCoach,
  getNotificationsForUser,
  markNotificationAsRead,
  getUserSchedule,
  getFeedbacks,
  markFeedbackAsRead,
  deleteFeedback,
  replyToFeedback,
  getFullCoachAnalytics,
  getCoachAnalytics,
};
