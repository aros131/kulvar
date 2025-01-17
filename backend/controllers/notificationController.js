const Notification = require('../models/Notification');
const BASE_URL = "https://kulvar.onrender.com";

async function getNotifications() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/notifications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Notifications:", data);
}

// Bildirimleri getir
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Bildirimler alınamadı.', error: err.message });
  }
};
