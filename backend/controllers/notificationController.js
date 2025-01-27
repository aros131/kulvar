const Notification = require("../models/Notification");

exports.sendNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;
    const notification = await Notification.create({
      userId,
      message,
      date: new Date(),
    });
    res.status(201).json({ message: "Notification sent successfully", notification });
  } catch (error) {
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ date: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};
