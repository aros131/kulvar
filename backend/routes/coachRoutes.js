// routes/coachRoutes.js
import { Router } from 'express';
import { listCoaches, getCoach } from '../controllers/coachController.js';

const router = Router();

// base: /coaches  (server mounts with app.use('/coaches', router))
router.get('/', listCoaches);     // GET /coaches
router.get('/:id', getCoach);     // GET /coaches/:id

export default router;
