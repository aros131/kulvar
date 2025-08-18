// routes/coachRoutes.js
import { Router } from 'express';
import { listCoaches, getCoach } from '../controllers/coachController.js';

const router = Router();

// ✅ These are the exact routes your frontend wants:
router.get('/coaches', listCoaches);
router.get('/coaches/:id', getCoach);

export default router;
