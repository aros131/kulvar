import express from 'express';
import Exercise from '../models/Exercise.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /exercises?q=bench&bodyPart=chest&limit=12
router.get('/', protect, async (req, res) => {
  try {
    const { q, bodyPart, equipment, limit = 12, skip = 0 } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { nameTR: { $regex: q.trim(), $options: 'i' } },
        { target: { $regex: q.trim(), $options: 'i' } },
        { targetTR: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    if (bodyPart) filter.bodyPart = bodyPart;
    if (equipment) filter.equipment = equipment;

    const [exercises, total] = await Promise.all([
      Exercise.find(filter)
        .select('name nameTR bodyPart bodyPartTR target targetTR equipment equipmentTR gifUrl level')
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Exercise.countDocuments(filter),
    ]);

    res.json({ exercises, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /exercises/body-parts
router.get('/body-parts', protect, async (req, res) => {
  try {
    const parts = await Exercise.distinct('bodyPart');
    res.json({ bodyParts: parts.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /exercises/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ex = await Exercise.findById(req.params.id).lean();
    if (!ex) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ exercise: ex });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
