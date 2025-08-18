// routes/coachRoutes.js
import { Router } from 'express';
import { listCoaches, getCoach } from '../controllers/coachController.js';

const router = Router();

// GET /coaches
router.get('/coaches', listCoaches);

// GET /coaches/:id
router.get('/coaches/:id', getCoach);

export default router;
