import express from 'express';
const router = express.Router();
import { requireUser as protect } from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import {
  listReviews,
  deleteReview,
  listCoachApplications,
  setCoachApproval,
  listPayments,
} from '../controllers/adminController.js';

router.get("/reviews", protect, roleMiddleware(["admin"]), listReviews);
router.delete("/reviews/:id", protect, roleMiddleware(["admin"]), deleteReview);

router.get("/coaches", protect, roleMiddleware(["admin"]), listCoachApplications);
router.patch("/coaches/:id/approval", protect, roleMiddleware(["admin"]), setCoachApproval);

router.get("/payments", protect, roleMiddleware(["admin"]), listPayments);

export default router;
