const Program = require('../models/Program');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Content = require('../models/Content');
const BASE_URL = "https://kulvar.onrender.com";

async function getPrograms() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/dashboard/programs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Coach programs:", data);
}
router.get("/progress", protect, roleMiddleware(["user"]), dashboardController.getProgress);

// Koçun programlarını getir
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ coachId: req.user.id });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Programlar alınamadı.', error: err.message });
  }
};

// Koçun müşterilerini getir
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ coachId: req.user.id, role: 'user' });
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ message: 'Müşteriler alınamadı.', error: err.message });
  }
};

// Analiz verilerini getir
exports.getAnalytics = async (req, res) => {
  try {
    const programs = await Program.find({ coachId: req.user.id });
    const analytics = programs.map((program) => ({
      programName: program.name,
      completionRate: program.completionRates.reduce((acc, curr) => acc + curr.rate, 0) / program.completionRates.length || 0,
    }));
    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ message: 'Analizler alınamadı.', error: err.message });
  }
};

// Kullanıcı programlarını getir
exports.getUserPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ userIds: req.user.id });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Programlar alınamadı.', error: err.message });
  }
};

// Kullanıcı ilerlemesini kaydet
exports.saveProgress = async (req, res) => {
  const { programId, completedExercises, notes } = req.body;

  try {
    const progress = new Progress({
      userId: req.user.id,
      programId,
      date: new Date(),
      completedExercises,
      notes,
    });

    await progress.save();
    res.status(201).json({ message: 'İlerleme kaydedildi.' });
  } catch (err) {
    res.status(500).json({ message: 'İlerleme kaydedilemedi.', error: err.message });
  }
};
