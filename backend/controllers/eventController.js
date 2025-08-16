import Event from '../models/Event.js';

const getUserId = (req) => req.user?.id || req.user?._id;

const safeDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// POST /api/events
export const addEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, start, end, allDay = false, description, programId, sessionId } = req.body;

    if (!title || !start) {
      return res.status(400).json({ message: 'title and start are required' });
    }

    const s = safeDate(start);
    const e = end ? safeDate(end) : new Date(new Date(start).getTime() + 60 * 60 * 1000); // default +1h
    if (!s || !e || s >= e) {
      return res.status(400).json({ message: 'Invalid start/end' });
    }

    const event = await Event.create({
      userId,
      title,
      start: s,
      end: e,
      allDay,
      description,
      programId,
      sessionId,
    });

    res.status(201).json({ message: 'Event added successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error adding event', error: error.message });
  }
};

// GET /api/events?from=ISO&to=ISO
export const getEvents = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { from, to } = req.query;

    const query = { userId };
    if (from && to) {
      const s = safeDate(from);
      const e = safeDate(to);
      if (s && e) {
        // overlap window [from,to]
        query.$and = [{ start: { $lt: e } }, { end: { $gt: s } }];
      }
    }

    const events = await Event.find(query).sort({ start: 1 }).lean();
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving events', error: error.message });
  }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const ev = await Event.findOne({ _id: id, userId });
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    const { title, start, end, allDay, description, status } = req.body;

    if (start) ev.start = safeDate(start);
    if (end)   ev.end = safeDate(end);
    if (ev.start && ev.end && ev.start >= ev.end) {
      return res.status(400).json({ message: 'Invalid start/end' });
    }
    if (title !== undefined) ev.title = title;
    if (allDay !== undefined) ev.allDay = !!allDay;
    if (description !== undefined) ev.description = description;
    if (status && ['planned','completed','missed','canceled'].includes(status)) {
      ev.status = status;
      ev.completedAt = status === 'completed' ? new Date() : undefined;
    }

    await ev.save();
    res.status(200).json({ message: 'Event updated successfully', event: ev });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const deleted = await Event.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

// PATCH /api/events/:id/complete
export const completeEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const ev = await Event.findOne({ _id: id, userId });
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    ev.status = 'completed';
    ev.completedAt = new Date();
    await ev.save();

    // Phase 2 hook: also call your progressController here
    // await markSessionCompleted(userId, ev.programId, ev.sessionId);

    res.status(200).json({ message: 'Event completed', event: ev });
  } catch (error) {
    res.status(500).json({ message: 'Error completing event', error: error.message });
  }
};
