import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createEngagement,
  listForCoach,
  listForUser,
  updateEngagement,
} from "../controllers/engagementController.js";

const router = Router();

router.post("/engagements", protect, roleMiddleware(["coach"]), createEngagement);
router.get("/engagements", protect, roleMiddleware(["coach"]), listForCoach);
router.get("/engagements/mine", protect, roleMiddleware(["user"]), listForUser);
router.patch("/engagements/:id", protect, roleMiddleware(["coach"]), updateEngagement);

export default router;
