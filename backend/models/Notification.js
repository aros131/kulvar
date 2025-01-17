const mongoose = require('mongoose');
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

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);
