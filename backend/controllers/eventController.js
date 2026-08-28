import Event from '../models/Event.js';
import Program from '../models/Program.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';

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

    // Update Progress collection + Program.progressTracking
    if (ev.programId) {
      const program = await Program.findById(ev.programId).select('dailySchedule progressTracking').lean();
      if (program) {
        const totalSessions = (program.dailySchedule || []).reduce(
          (sum, day) => sum + (day.sessions?.length || 0), 0
        );
        const completedCount = await Event.countDocuments({
          userId,
          programId: ev.programId,
          status: 'completed',
        });
        const progressPercentage = totalSessions > 0
          ? Math.min(100, Math.round((completedCount / totalSessions) * 100))
          : 0;

        // 1. Update Progress collection (used by analytics + programs pages)
        const sessionKey = ev.externalKey || ev.sessionId || ev._id.toString();
        let progress = await Progress.findOne({ userId, programId: ev.programId });
        if (!progress) {
          progress = new Progress({ userId, programId: ev.programId, completedSessions: [] });
        }
        const alreadyTracked = progress.completedSessions.some(
          (s) => s.sessionId === sessionKey
        );
        if (!alreadyTracked) {
          progress.completedSessions.push({ sessionId: sessionKey, completed: true, dateCompleted: new Date() });
        }
        progress.progressPercentage = progressPercentage;
        await progress.save();

        // 2. Update Program.progressTracking (used by coach client detail)
        const updateResult = await Program.updateOne(
          { _id: ev.programId, 'progressTracking.user': userId },
          { $set: { 'progressTracking.$.completedSessions': completedCount, 'progressTracking.$.progressPercentage': progressPercentage } }
        );
        if (updateResult.matchedCount === 0) {
          await Program.updateOne(
            { _id: ev.programId },
            { $push: { progressTracking: { user: userId, completedSessions: completedCount, progressPercentage } } }
          );
        }
      }
    }

    // Koça bildirim: danışan antrenman tamamladı
    if (ev.programId) {
      const program = await Program.findById(ev.programId).select('coachId name').lean();
      if (program?.coachId) {
        const user = await User.findById(userId).select('name').lean();
        await notify({
          recipientId: program.coachId,
          senderId: userId,
          type: 'session_completed',
          message: `${user?.name || 'Danışanın'} "${ev.title}" antrenmanını tamamladı.`,
        });
      }
    }

    res.status(200).json({ message: 'Event completed', event: ev });
  } catch (error) {
    res.status(500).json({ message: 'Error completing event', error: error.message });
  }
};
// GET /events?from=ISO&to=ISO&programId=&assignmentId=
export const getEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { from, to, programId, assignmentId } = req.query;

    const query = { userId };
    if (programId)    query.programId = programId;
    if (assignmentId) query.assignmentId = assignmentId;

    // Overlap window: start < to && end > from
    const s = from ? new Date(from) : null;
    const e = to   ? new Date(to)   : null;
    if (s && !Number.isNaN(s.getTime())) {
      query.end = { ...(query.end || {}), $gt: s };
    }
    if (e && !Number.isNaN(e.getTime())) {
      query.start = { ...(query.start || {}), $lt: e };
    }

    const events = await Event.find(query).sort({ start: 1 }).lean();
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving events', error: error.message });
  }
};