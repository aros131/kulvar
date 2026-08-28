import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { createFeedback, getFeedbacks } from '../controllers/feedbackController.js';
import { sendContactFormReceived } from '../services/emailService.js';

router.post("/", protect, createFeedback);
router.get("/", protect, getFeedbacks);

// Public contact form — no auth required
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    // Store in a simple in-memory log; in production swap for DB or email service
    console.log(`[CONTACT] ${new Date().toISOString()} | ${name} <${email}>: ${message}`);
    sendContactFormReceived({ name, email, message }).catch(() => {});
    res.status(200).json({ message: 'Mesaj alındı.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

export default router;
