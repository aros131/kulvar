import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { addEvent, getEvents, updateEvent, deleteEvent } from '../controllers/calendarController.js';

router.post("/", protect, roleMiddleware(["coach"]), addEvent); // Add an event to the calendar
router.get("/", protect, getEvents); // Get all events for the user/coach
router.put("/:id", protect, roleMiddleware(["coach"]), updateEvent); // Update an event
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteEvent); // Delete an event

export default router;
