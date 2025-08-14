import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { sendMessage, getMessages } from '../controllers/messageController.js';

router.post("/", protect, sendMessage); // Send a message
router.get("/", protect, getMessages); // Get all messages for the user

export default router;
