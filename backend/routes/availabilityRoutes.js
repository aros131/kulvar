import { Router } from "express";
import { requireCoach } from "../middleware/authMiddleware.js";
import * as Ctrl from "../controllers/availabilityController.js";

const router = Router();

// coach-only: manage my weekly rules
router.get("/me/availability/rules", requireCoach, Ctrl.getMyRules);
router.put("/me/availability/rules", requireCoach, Ctrl.putMyRules);

// public: show generated slots for a coach
router.get("/coaches/:id/availability", Ctrl.publicListAvailability);

export default router;
