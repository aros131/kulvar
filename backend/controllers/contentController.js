const Content = require('../models/Content');

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
