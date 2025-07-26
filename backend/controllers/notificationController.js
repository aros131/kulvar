import Notification from '../models/Notification.js'; 
export const sendNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;

    // ✅ Validate required fields
    if (!userId || !message || !type) {
      return res.status(400).json({ message: "Client ID, message, and type are required" });
    }

    // ✅ Create the notification with senderId
    const notification = await Notification.create({
      recipientId: userId,
      message,
      type,
      senderId: req.user._id, // 🔁 Coach veya sistemden gelen
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};



export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notifications", error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ message: "Bildirim okundu olarak işaretlendi." });
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error: error.message });
  }
};


export const getCoachSentNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ senderId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error retrieving sent notifications:", error.message);
    res.status(500).json({ message: "Error retrieving sent notifications", error: error.message });
  }
};
