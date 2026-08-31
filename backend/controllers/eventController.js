import Event from '../models/Event.js';
import Program from '../models/Program.js';
import Progress from '../models/Progress.js';
import ProgramAssignment from '../models/ProgramAssignment.js';
import User from '../models/User.js';
import WorkoutLog from '../models/WorkoutLog.js';
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

// POST /api/events/rebuild  (coach only)
// Body: { userId, programId }
// Finds the OLDEST ProgramAssignment for this user+program, deletes all other assignments'
// events, then rebuilds events from the original startDate so dates are correct.
export const rebuildEvents = async (req, res) => {
  try {
    const { userId, programId } = req.body;
    if (!userId || !programId) {
      return res.status(400).json({ message: 'userId and programId are required' });
    }

    // 1. Find all assignments for this user+program, oldest first
    const assignments = await ProgramAssignment.find({ userId, programId }).sort({ createdAt: 1 }).lean();
    if (!assignments.length) {
      return res.status(404).json({ message: 'No ProgramAssignment found' });
    }

    const original = assignments[0]; // oldest = authoritative

    // 2. Delete events from NEWER assignments (duplicates)
    if (assignments.length > 1) {
      const newerIds = assignments.slice(1).map(a => a._id);
      await Event.deleteMany({ userId, programId, assignmentId: { $in: newerIds } });
      await ProgramAssignment.deleteMany({ _id: { $in: newerIds } });
    }

    // 3. Rebuild events from original startDate
    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const days = Array.isArray(program.dailySchedule) ? program.dailySchedule : [];
    const startDate = new Date(original.startDate); startDate.setHours(0, 0, 0, 0);
    const fallbackTime = original.defaultTimeOfDay || program.defaultTimeOfDay || '18:00';
    const toInt = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
    const parseHHmm = (hhmm = '18:00') => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
      if (!m) return { h: 18, m: 0 };
      return { h: Math.min(23, Math.max(0, Number(m[1]))), m: Math.min(59, Math.max(0, Number(m[2]))) };
    };
    const { h: defH, m: defM } = parseHHmm(fallbackTime);
    const programDefaultDur = toInt(program.defaultDurationMin, 60);

    const ops = [];
    for (let d = 0; d < days.length; d++) {
      const sessions = Array.isArray(days[d]?.sessions) ? days[d].sessions : [];
      const baseDate = new Date(startDate); baseDate.setDate(baseDate.getDate() + d);
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i] || {};
        const sid = String(s.sessionId || s._id || s.id || `${d}-${i}`);
        const title = s.name || `Seans ${i + 1}`;
        const t = typeof s.timeOfDay === 'string' ? parseHHmm(s.timeOfDay) : { h: defH, m: defM };
        const dur = toInt(s.durationMin, programDefaultDur);
        const st = new Date(baseDate); st.setHours(toInt(t.h, defH), toInt(t.m, defM), 0, 0);
        const en = new Date(st); en.setMinutes(en.getMinutes() + dur);
        const externalKey = `${original._id}:${d}:${i}`;
        ops.push({
          updateOne: {
            filter: { userId, programId, assignmentId: original._id, externalKey },
            update: {
              $setOnInsert: { userId, programId, assignmentId: original._id, externalKey, source: 'program', status: 'planned' },
              $set: { sessionId: sid, title, start: st, end: en, timezone: 'Europe/Istanbul' },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length) await Event.bulkWrite(ops, { ordered: false });

    return res.status(200).json({
      message: 'Events rebuilt from original start date',
      startDate: original.startDate,
      deletedAssignments: assignments.length - 1,
      rebuiltEvents: ops.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rebuilding events', error: error.message });
  }
};

// POST /events/:id/log
export const saveWorkoutLog = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { exercises } = req.body;

    const ev = await Event.findOne({ _id: id, userId }).lean();
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    const log = await WorkoutLog.findOneAndUpdate(
      { userId, eventId: id },
      { userId, eventId: id, programId: ev.programId, date: ev.start, exercises },
      { upsert: true, new: true }
    );

    res.status(200).json({ log });
  } catch (error) {
    res.status(500).json({ message: 'Error saving workout log', error: error.message });
  }
};

// GET /events/:id/log
export const getWorkoutLog = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const log = await WorkoutLog.findOne({ userId, eventId: id }).lean();
    res.status(200).json({ log: log || null });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workout log', error: error.message });
  }
};
