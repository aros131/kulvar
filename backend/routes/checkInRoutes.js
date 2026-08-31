import express from 'express';
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import CheckIn from '../models/CheckIn.js';
import ProgramAssignment from '../models/ProgramAssignment.js';
import { notify } from '../utils/notify.js';

const router = express.Router();
const uid = (req) => req.user._id || req.user.id;

// POST /check-ins — danışan check-in gönderir
router.post('/', protect, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = uid(req);
    const { programId, week, weight, energyLevel, sleepQuality, stressLevel, completedWorkouts, note } = req.body;

    // Koç ID'sini program atamasından bul
    let coachId = null;
    if (programId) {
      const assignment = await ProgramAssignment.findOne({ userId, programId, status: 'active' })
        .populate({ path: 'programId', select: 'coachId' })
        .lean();
      coachId = assignment?.programId?.coachId || null;
    }

    const checkin = await CheckIn.create({
      userId, coachId, programId: programId || null,
      week: week ?? 1, weight, energyLevel, sleepQuality, stressLevel, completedWorkouts, note,
    });

    // Koça bildirim gönder
    if (coachId) {
      const { default: User } = await import('../models/User.js');
      const user = await User.findById(userId).select('name').lean();
      await notify({
        recipientId: coachId,
        senderId: userId,
        type: 'check_in',
        message: `${user?.name || 'Danışanın'} ${week}. hafta check-in'ini gönderdi.`,
      }).catch(() => {});
    }

    res.status(201).json({ checkIn: checkin });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /check-ins — danışanın kendi check-in listesi
router.get('/', protect, roleMiddleware(['user']), async (req, res) => {
  try {
    const { programId } = req.query;
    const query = { userId: uid(req) };
    if (programId) query.programId = programId;
    const list = await CheckIn.find(query).sort({ date: -1 }).lean();
    res.json({ checkIns: list });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /check-ins/client/:clientId — koç bir danışanın check-in'lerini görür
router.get('/client/:clientId', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { programId } = req.query;
    const query = { userId: req.params.clientId, coachId: uid(req) };
    if (programId) query.programId = programId;
    const list = await CheckIn.find(query).sort({ date: -1 }).lean();
    res.json({ checkIns: list });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
