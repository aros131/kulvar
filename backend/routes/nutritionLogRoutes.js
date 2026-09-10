import express from 'express';
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import NutritionLog from '../models/NutritionLog.js';
import Program from '../models/Program.js';

const router = express.Router();
const uid = (req) => req.user._id || req.user.id;

// POST /nutrition-logs — danışan günün beslenme özetini kaydeder/günceller (tarih başına tek kayıt)
router.post('/', protect, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = uid(req);
    const { date, calories, protein, carbs, fat, water, items } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });

    const log = await NutritionLog.findOneAndUpdate(
      { userId, date },
      { $set: { calories, protein, carbs, fat, water, items: Array.isArray(items) ? items : [] } },
      { new: true, upsert: true }
    );

    res.status(200).json({ nutritionLog: log });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /nutrition-logs — danışanın kendi geçmişi (opsiyonel ?from=YYYY-MM-DD&to=YYYY-MM-DD)
router.get('/', protect, roleMiddleware(['user']), async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { userId: uid(req) };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const list = await NutritionLog.find(query).sort({ date: -1 }).lean();
    res.json({ nutritionLogs: list });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /nutrition-logs/client/:clientId — koç, kendi danışanının kayıtlarını görür
router.get('/client/:clientId', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const isOwnClient = await Program.exists({ coachId: uid(req), assignedClients: req.params.clientId });
    if (!isOwnClient) return res.status(403).json({ message: "Bu danışan size ait değil" });

    const { from, to } = req.query;
    const query = { userId: req.params.clientId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const list = await NutritionLog.find(query).sort({ date: -1 }).lean();
    res.json({ nutritionLogs: list });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
