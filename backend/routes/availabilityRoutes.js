import express from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getMyRules, putMyRules, publicListAvailability } from "../controllers/availabilityController.js";

const availabilityRouter = express.Router();

// coach dashboard (auth) — weekly rules
availabilityRouter.get("/me/availability/rules", protect, roleMiddleware(["coach"]), getMyRules);
availabilityRouter.put("/me/availability/rules", protect, roleMiddleware(["coach"]), putMyRules);

// public — slots generated from rules (NO auth)
availabilityRouter.get("/coaches/:id/availability", publicListAvailability);

export default availabilityRouter;
