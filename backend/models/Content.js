const mongoose = require('mongoose');
const BASE_URL = "https://kulvar.onrender.com";

async function getContent() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Content:", data);
}


const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  type: { type: String, enum: ['video', 'image', 'document'], required: true }, // Content type
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Content', ContentSchema);
