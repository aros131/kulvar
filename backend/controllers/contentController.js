const Content = require('../models/Content');
const BASE_URL = "https://kulvar-qb7t.onrender.com";

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

// Yeni içerik yükle
exports.uploadContent = async (req, res) => {
  const { title, type, fileUrl } = req.body;

  try {
    const content = new Content({
      title,
      type,
      fileUrl,
      coachId: req.user.id,
    });

    await content.save();
    res.status(201).json({ message: 'İçerik başarıyla yüklendi.' });
  } catch (err) {
    res.status(500).json({ message: 'İçerik yükleme başarısız.', error: err.message });
  }
};

// İçerikleri getir
exports.getContents = async (req, res) => {
  try {
    const contents = await Content.find({ coachId: req.user.id });
    res.json({ contents });
  } catch (err) {
    res.status(500).json({ message: 'İçerikler alınamadı.', error: err.message });
  }
};
exports.createContent = async (req, res) => {
  try {
      const { title, description } = req.body;
      const newContent = await Content.create({ title, description });
      res.status(201).json(newContent);
  } catch (error) {
      res.status(500).json({ message: "Error creating content", error: error.message });
  }
};
