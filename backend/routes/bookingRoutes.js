// routes/bookingRoutes.js (ESM)
import { Router } from "express";
import { requireUser, requireCoach } from "../middleware/auth.js";
import * as BookingCtrl from "../controllers/bookingController.js";

const router = Router();

router.post("/bookings", requireUser, BookingCtrl.createPending);              // user: create PENDING
router.post("/bookings/:id/approve", requireCoach, BookingCtrl.approve);       // coach: APPROVE
router.post("/bookings/:id/decline", requireCoach, BookingCtrl.decline);       // coach: DECLINE
router.get("/bookings/pending", requireCoach, BookingCtrl.listPendingForCoach);// coach: list requests

export default router;


