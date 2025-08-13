import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js'; // Ensure this exists and is correct
import contentController from '../controllers/contentController.js'; // Ensure this exists and is correct

// Define routes
router.get("/", protect, contentController.getContents); // Ensure `getContents` is defined
router.post("/", protect, contentController.createContent); // Ensure `createContent` is defined

export default router;
