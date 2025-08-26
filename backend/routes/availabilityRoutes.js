// backend/routes/availabilityRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getMyRules, putMyRules } from "../controllers/availabilityController.js";

const availabilityRouter = express.Router();

// Coach weekly availability rules
availabilityRouter.get("/me/availability/rules", protect, roleMiddleware(["coach"]), getMyRules);
availabilityRouter.put("/me/availability/rules", protect, roleMiddleware(["coach"]), putMyRules);

export default availabilityRouter;
