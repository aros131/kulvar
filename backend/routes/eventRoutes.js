import express from 'express';
const router = express.Router();

import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

// Controllers (use the names you implemented)
import {
  getEvents,      // GET list (supports ?from=&to=)
  addEvent,       // POST create
  updateEvent,    // PUT update by :id
  deleteEvent,    // DELETE by :id
  completeEvent,  // PATCH mark completed by :id
  rebuildEvents,  // POST rebuild events from original assignment date
  saveWorkoutLog, // POST save set-based workout log
  getWorkoutLog,  // GET existing log for an event
} from '../controllers/eventController.js';

/**
 * User-only for now (each route checks req.user to ensure ownership).
 * If you want coach tools later, we’ll add coach-specific filters safely.
 */

// List user events (optionally range-filtered with ?from&to)
router.get('/', protect, roleMiddleware(['user']), getEvents);

// Create
router.post('/', protect, roleMiddleware(['user']), addEvent);

// Update (reschedule/rename/etc.)
router.put('/:id', protect, roleMiddleware(['user']), updateEvent);

// Delete
router.delete('/:id', protect, roleMiddleware(['user']), deleteEvent);

// Mark completed
router.patch('/:id/complete', protect, roleMiddleware(['user']), completeEvent);

// Fix: rebuild events from original assignment startDate (coach only)
router.post('/rebuild', protect, roleMiddleware(['coach']), rebuildEvents);

// Set-based workout log
router.post('/:id/log', protect, roleMiddleware(['user']), saveWorkoutLog);
router.get('/:id/log',  protect, roleMiddleware(['user']), getWorkoutLog);

export default router;
