import express from 'express';
const router = express.Router();
import { getCoaches } from '../controllers/coachController.js';

router.get("/", getCoaches);

export default router;
