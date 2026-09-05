import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import protect from '../middleware/authMiddleware.js';
import ProgressPhoto from '../models/ProgressPhoto.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = (process.env.BASE_URL || process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'progress'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

// POST /progress-photos — upload a photo
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `${BASE_URL}/uploads/progress/${req.file.filename}`;
    const { note, weight, programId, date } = req.body;
    const photo = await ProgressPhoto.create({
      userId: req.user._id || req.user.id,
      url,
      note: note || '',
      weight: weight ? parseFloat(weight) : null,
      programId: programId || null,
      date: date ? new Date(date) : new Date(),
    });
    res.status(201).json({ photo });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// GET /progress-photos — list user's photos
router.get('/', protect, async (req, res) => {
  try {
    const { programId } = req.query;
    const query = { userId: req.user._id || req.user.id };
    if (programId) query.programId = programId;
    const photos = await ProgressPhoto.find(query).sort({ date: -1 }).lean();
    res.status(200).json({ photos });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos', error: error.message });
  }
});

// DELETE /progress-photos/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const deleted = await ProgressPhoto.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) return res.status(404).json({ message: 'Photo not found' });
    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting photo', error: error.message });
  }
});

export default router;
