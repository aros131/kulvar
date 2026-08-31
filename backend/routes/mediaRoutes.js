import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'exercises'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    if (/^(video|image)\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only video and image files are allowed'));
  },
});

// POST /media/upload  (coach only)
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`;
  const url = `${API}/uploads/exercises/${req.file.filename}`;
  res.json({ url });
});

export default router;
