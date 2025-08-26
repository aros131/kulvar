// routes/availabilityRoutes.js (ESM)
import { Router } from "express";
import { getAvailability } from "../controllers/availabilityController.js";
const router = Router();

router.get("/:id/availability", getAvailability);
export default router;
