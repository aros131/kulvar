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


exports.getNotifications = async (req, res) => {
  try {
    const notifications = await NNotification.find({ recipientId: req.user.id }).sort({ createdAt: -1 })

  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bildirim bulunamadı" });
    }

    res.status(200).json({ message: "Bildirim okundu olarak işaretlendi", notification: updated });
  } catch (error) {
    console.error("Bildirim işaretleme hatası:", error.message);
    res.status(500).json({ message: "Bildirim işaretleme hatası", error: error.message });
  }
};
