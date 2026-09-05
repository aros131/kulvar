import express from 'express';
const router = express.Router();
import { searchClients, getClientById } from '../controllers/userController.js';

import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

router.get("/clients", protect, roleMiddleware(["coach"]), searchClients);
router.get("/:clientId", protect, roleMiddleware(["coach"]), getClientById);

export default router;
