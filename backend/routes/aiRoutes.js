import express from 'express';
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import CheckIn from '../models/CheckIn.js';
import User from '../models/User.js';
import WorkoutLog from '../models/WorkoutLog.js';
import {
  analyzeCheckIn,
  generateCheckInReply,
  generateProgram,
  suggestAlternatives,
  generateNutritionPlan,
  generateProgressReport,
  matchCoach,
  generateOnboardingPlan,
  analyzeChurnRisk,
  suggestProgramAdaptation,
  assessInjuryRisk,
  generateSocialContent,
  generateCoachInsights,
} from '../services/aiService.js';

const router = express.Router();

// POST /ai/check-in-analysis   (koç)
router.post('/check-in-analysis', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { checkInId } = req.body;
    const checkIn = await CheckIn.findById(checkInId).lean();
    if (!checkIn) return res.status(404).json({ message: 'Check-in bulunamadı' });

    const client = await User.findById(checkIn.userId).select('name').lean();
    const analysis = await analyzeCheckIn(checkIn, client?.name || 'Danışan');
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/check-in-reply   (koç)
router.post('/check-in-reply', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { checkInId } = req.body;
    const checkIn = await CheckIn.findById(checkInId).lean();
    if (!checkIn) return res.status(404).json({ message: 'Check-in bulunamadı' });

    const [client, coach] = await Promise.all([
      User.findById(checkIn.userId).select('name').lean(),
      User.findById(req.user.id).select('name').lean(),
    ]);
    const reply = await generateCheckInReply(checkIn, client?.name || 'Danışan', coach?.name);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/generate-program   (koç)
router.post('/generate-program', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const program = await generateProgram(req.body);
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/exercise-alternatives   (user veya coach)
router.post('/exercise-alternatives', protect, async (req, res) => {
  try {
    const { exerciseName, reason, equipment } = req.body;
    if (!exerciseName) return res.status(400).json({ message: 'exerciseName gerekli' });
    const alternatives = await suggestAlternatives(exerciseName, reason, equipment);
    res.json({ alternatives });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/nutrition-plan   (koç veya user)
router.post('/nutrition-plan', protect, async (req, res) => {
  try {
    const plan = await generateNutritionPlan(req.body);
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/progress-report   (koç)
router.post('/progress-report', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { clientId } = req.body;
    const client = await User.findById(clientId).select('name').lean();
    const checkIns = await CheckIn.find({ userId: clientId }).sort({ date: 1 }).lean();
    const workoutLogs = await WorkoutLog.find({ userId: clientId }).lean();
    const report = await generateProgressReport(client?.name || 'Danışan', checkIns, workoutLogs);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/onboarding-plan   (any authenticated user)
router.post('/onboarding-plan', protect, async (req, res) => {
  try {
    const plan = await generateOnboardingPlan(req.body);
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/coach-match   (any authenticated user)
router.post('/coach-match', protect, async (req, res) => {
  try {
    const result = await matchCoach(req.body);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/churn-risk   (koç)
router.post('/churn-risk', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ message: 'clientId gerekli' });
    const client = await User.findById(clientId).select('name').lean();
    if (!client) return res.status(404).json({ message: 'Danışan bulunamadı' });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [checkIns, workoutLogs] = await Promise.all([
      CheckIn.find({ userId: clientId }).sort({ date: 1 }).limit(8).lean(),
      WorkoutLog.find({ userId: clientId, date: { $gte: thirtyDaysAgo } }).lean(),
    ]);
    // New client with no data — don't waste AI tokens, return sensible default
    if (checkIns.length === 0 && workoutLogs.length === 0) {
      return res.json({ risk: { level: 'low', reasons: ['Henüz check-in yapılmamış, yeni danışan'], action: 'İlk check-in için hatırlatıcı mesaj gönderin.' } });
    }
    const risk = await analyzeChurnRisk(client.name, checkIns, workoutLogs);
    res.json({ risk });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/program-adaptation   (koç)
router.post('/program-adaptation', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { clientId, programInfo } = req.body;
    if (!clientId) return res.status(400).json({ message: 'clientId gerekli' });
    const client = await User.findById(clientId).select('name').lean();
    const lastCheckIn = await CheckIn.findOne({ userId: clientId }).sort({ date: -1 }).lean();
    if (!lastCheckIn) return res.status(404).json({ message: 'Check-in bulunamadı' });
    const suggestion = await suggestProgramAdaptation(client?.name || 'Danışan', lastCheckIn, programInfo);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/injury-risk   (koç)
router.post('/injury-risk', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ message: 'clientId gerekli' });
    const client = await User.findById(clientId).select('name').lean();
    const checkIns = await CheckIn.find({ userId: clientId }).sort({ date: -1 }).limit(8).lean();
    const assessment = await assessInjuryRisk(client?.name || 'Danışan', checkIns);
    res.json({ assessment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/social-content   (koç)
router.post('/social-content', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const { achievements } = req.body;
    if (!achievements) return res.status(400).json({ message: 'achievements gerekli' });
    const content = await generateSocialContent(null, achievements);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /ai/coach-insights   (koç)
router.post('/coach-insights', protect, roleMiddleware(['coach']), async (req, res) => {
  try {
    const coach = await User.findById(req.user.id).select('name').lean();
    const insights = await generateCoachInsights(coach?.name, req.body);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
