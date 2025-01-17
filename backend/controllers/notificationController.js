const Notification = require('../models/Notification');

// Bildirimleri getir
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Bildirimler alınamadı.', error: err.message });
  }
};
