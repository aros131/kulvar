import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createPending,
  approve,
  decline,
  listPendingForCoach,
  listMine,
  cancel,
} from "../controllers/bookingController.js";

const router = Router();

// user → create a pending request
router.post("/bookings", protect, roleMiddleware(["user"]), createPending);

// coach → see/approve/decline
router.get("/bookings/pending", protect, roleMiddleware(["coach"]), listPendingForCoach);
router.post("/bookings/:id/approve", protect, roleMiddleware(["coach"]), approve);
router.post("/bookings/:id/decline", protect, roleMiddleware(["coach"]), decline);

// user → list/cancel own bookings
router.get("/bookings/mine", protect, roleMiddleware(["user"]), listMine);
router.post("/bookings/:id/cancel", protect, roleMiddleware(["user"]), cancel);

export default router;
