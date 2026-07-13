import express from 'express';
const router = express.Router();
import { requireUser as protect } from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { listReviews, deleteReview } from '../controllers/adminController.js';

router.get("/reviews", protect, roleMiddleware(["admin"]), listReviews);
router.delete("/reviews/:id", protect, roleMiddleware(["admin"]), deleteReview);

export default router;
