import express from 'express';
const router = express.Router();
import { searchClients } from '../controllers/clientGroupController.js'; // ya da ayrı controller yazacaksan oradan

import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

// 🆕 Tüm kullanıcıları (role: user) aramak için route
router.get("/clients", protect, roleMiddleware(["coach"]), searchClients);

export default router;
