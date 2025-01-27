const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { addEvent, getEvents, updateEvent, deleteEvent } = require("../controllers/calendarController");

router.post("/", protect, roleMiddleware(["coach"]), addEvent); // Add an event to the calendar
router.get("/", protect, getEvents); // Get all events for the user/coach
router.put("/:id", protect, roleMiddleware(["coach"]), updateEvent); // Update an event
router.delete("/:id", protect, roleMiddleware(["coach"]), deleteEvent); // Delete an event

module.exports = router;
