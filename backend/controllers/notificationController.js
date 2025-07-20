const Notification = require("../models/Notification");

exports.sendNotification = async (req, res) => {
  try {
    const { clientId, message, type } = req.body;

    // ✅ Validate required fields
    if (!clientId || !message || !type) {
      return res.status(400).json({ message: "Client ID, message, and type are required" });
    }

    // ✅ Create the notification with recipientId mapped
    const notification = await Notification.create({
      recipientId: clientId, // 🔁 maps clientId to recipientId in schema
      message,
      type,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};


exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ message: "Bildirim okundu olarak işaretlendi." });
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error: error.message });
  }
};
