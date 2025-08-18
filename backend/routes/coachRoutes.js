// routes/coachRoutes.js
import { Router } from 'express';
import { listCoaches } from '../controllers/coachController.js';

const router = Router();

// GET /coaches  (ROOT, not /api/coaches)
router.get('/coaches', listCoaches);

export default router;
