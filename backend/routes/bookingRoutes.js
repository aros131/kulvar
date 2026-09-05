import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createPending,
  approve,
  decline,
  listPendingForCoach,
  listConfirmedForCoach,
  complete,
  listMine,
  cancel,
} from "../controllers/bookingController.js";

const router = Router();

// user → create a pending request
router.post("/bookings", protect, roleMiddleware(["user"]), createPending);

// coach → see/approve/decline/complete
router.get("/bookings/pending", protect, roleMiddleware(["coach"]), listPendingForCoach);
router.get("/bookings/confirmed", protect, roleMiddleware(["coach"]), listConfirmedForCoach);
router.post("/bookings/:id/approve", protect, roleMiddleware(["coach"]), approve);
router.post("/bookings/:id/decline", protect, roleMiddleware(["coach"]), decline);
router.post("/bookings/:id/complete", protect, roleMiddleware(["coach"]), complete);

// user → list/cancel own bookings
router.get("/bookings/mine", protect, roleMiddleware(["user"]), listMine);
router.post("/bookings/:id/cancel", protect, roleMiddleware(["user"]), cancel);

export default router;
