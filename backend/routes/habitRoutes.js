import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { Habit, HabitLog } from '../models/Habit.js';

const router = express.Router();
const uid = (req) => req.user._id || req.user.id;

// GET /habits — list user's habits
router.get('/', protect, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: uid(req), active: true }).sort({ createdAt: 1 }).lean();
    res.json({ habits });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /habits — create habit
router.post('/', protect, async (req, res) => {
  try {
    const { name, emoji } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'name required' });
    const habit = await Habit.create({ userId: uid(req), name: name.trim(), emoji: emoji || '✅' });
    res.status(201).json({ habit });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /habits/:id — soft-delete
router.delete('/:id', protect, async (req, res) => {
  try {
    await Habit.findOneAndUpdate({ _id: req.params.id, userId: uid(req) }, { active: false });
    res.json({ message: 'deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /habits/logs?date=YYYY-MM-DD — get log status for a day
router.get('/logs', protect, async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ message: 'date required' });
    const logs = await HabitLog.find({ userId: uid(req), date }).lean();
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /habits/logs — toggle a habit log for a date
router.post('/logs', protect, async (req, res) => {
  try {
    const { habitId, date, done } = req.body;
    if (!habitId || !date) return res.status(400).json({ message: 'habitId and date required' });
    const log = await HabitLog.findOneAndUpdate(
      { userId: uid(req), habitId, date },
      { done: done !== false },
      { upsert: true, new: true }
    );
    res.json({ log });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /habits/streak?habitId= — compute current streak for a habit
router.get('/streak', protect, async (req, res) => {
  try {
    const { habitId } = req.query;
    if (!habitId) return res.status(400).json({ message: 'habitId required' });
    const logs = await HabitLog.find({ userId: uid(req), habitId, done: true })
      .sort({ date: -1 })
      .lean();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const dates = new Set(logs.map(l => l.date));
    let cursor = today;
    while (dates.has(cursor)) {
      streak++;
      const d = new Date(cursor + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    }
    res.json({ streak });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
