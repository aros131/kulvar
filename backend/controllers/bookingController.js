// controllers/bookingController.js
import mongoose from "mongoose";
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import { notify } from "../services/NotificationService.js"; // must export notify(...)
import { getCoachAvailabilityConfig } from "../services/availability.js"; // must export getCoachAvailabilityConfig(...)

// ---------------------------------------------------------------------------
// constants & helpers
// ---------------------------------------------------------------------------
const HOLD_MS = 24 * 60 * 60 * 1000; // 24 hours hold for "pending"

function asDateISO(v) {
  // Accept string|Date; return valid Date or null
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.valueOf()) ? d : null;
}

/**
 * Build a query that finds any booking that overlaps [start,end) for a coach:
 * - confirmed always block
 * - pending block only while hold is active (holdUntil > now)
 */
function overlapQuery({ coachId, start, end, now, excludeId }) {
  const or = [
    { status: "confirmed", startUtc: { $lt: end }, endUtc: { $gt: start } },
    {
      status: "pending",
      holdUntil: { $gt: now },
      startUtc: { $lt: end },
      endUtc: { $gt: start },
    },
  ];
  const q = { coachId, $or: or };
  if (excludeId) q._id = { $ne: excludeId };
  return q;
}

async function expireStalePendings(coachId, session) {
  const now = new Date();
  await Booking.updateMany(
    { coachId, status: "pending", holdUntil: { $lte: now } },
    { $set: { status: "expired" }, $unset: { holdUntil: 1 } },
    { session },
  );
}

/** best-effort check for replica/mongos to enable transactions */
function supportsTransactions() {
  try {
    const topo = mongoose.connection?.client?.topology;
    const type =
      topo?.description?.type ||
      (topo?.s?.options?.replicaSet ? "ReplicaSet" : "Single");
    return String(type).toLowerCase().includes("replica")
      || String(type).toLowerCase().includes("mongos");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// controllers
// ---------------------------------------------------------------------------

/**
 * POST /bookings
 * Body: { coachId, startUtc, endUtc, meetingMode, location?, notes? }
 * Requires: role=user (middleware)
 * Effect: Creates a PENDING booking that holds the slot for 24h.
 */
export async function createPending(req, res) {
  try {
    const userId = String(req.user?._id || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { coachId, startUtc, endUtc, meetingMode, location, notes } = req.body || {};
    if (!coachId) return res.status(400).json({ message: "coachId is required" });
    if (!["in_person", "zoom"].includes(meetingMode)) {
      return res.status(400).json({ message: "meetingMode invalid" });
    }

    const start = asDateISO(startUtc);
    const end = asDateISO(endUtc);
    if (!start || !end || end <= start) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    // lead-time policy (e.g., 12h default)
    const { leadTimeMin = 12 * 60 } = await getCoachAvailabilityConfig(coachId);
    if (DateTime.fromJSDate(start, { zone: "utc" }) < DateTime.utc().plus({ minutes: leadTimeMin })) {
      return res.status(400).json({ message: "Slot is too soon to book." });
    }

    const now = new Date();

    const doWork = async (session) => {
      // 0) clean stale pendings so they don't keep blocking
      await expireStalePendings(coachId, session);

      // 1) hard overlap check
      const conflict = await Booking.findOne(
        overlapQuery({ coachId, start, end, now }),
      ).session(session).lean();
      if (conflict) {
        return res.status(409).json({ message: "Slot already held or booked." });
      }

      // 2) create pending hold
      const [created] = await Booking.create([{
        coachId,
        userId,
        startUtc: start,
        endUtc: end,
        meetingMode,
        location,
        notes,
        status: "pending",
        holdUntil: new Date(Date.now() + HOLD_MS),
      }], { session });

      // 3) notify coach (best effort)
      try {
        await notify({
          toUserId: coachId,
          type: "booking_request",
          title: "Yeni rezervasyon isteği",
          message: "Onaylamak için tıklayın.",
          data: {
            bookingId: created._id,
            startUtc: created.startUtc,
            endUtc: created.endUtc,
            meetingMode,
            userId,
          },
        });
      } catch (e) {
        // Do not fail the booking if notification fails
        console.warn("notify(booking_request) failed:", e?.message || e);
      }

      return res.status(201).json({ ok: true, bookingId: created._id, status: "pending" });
    };

    if (supportsTransactions()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(() => doWork(session));
        return; // IMPORTANT: stop here, response already sent inside doWork
      } finally {
        session.endSession();
      }
    } else {
      return await doWork(null);
    }
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Slot just got taken." });
    }
    console.error("createPending error:", err);
    return res.status(500).json({ message: "Failed to create booking." });
  }
}

/**
 * POST /bookings/:id/approve
 * Requires: role=coach
 * Effect: pending -> confirmed, expire other overlapping pendings.
 */
export async function approve(req, res) {
  try {
    const coachId = String(req.user?._id || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const now = new Date();

    const doWork = async (session) => {
      const booking = await Booking.findOne({ _id: id, coachId }).session(session);
      if (!booking) return res.status(404).json({ message: "Not found." });
      if (booking.status !== "pending") return res.status(400).json({ message: "Not pending." });

      // hold expired?
      if (booking.holdUntil && booking.holdUntil <= now) {
        booking.status = "expired";
        booking.holdUntil = null;
        await booking.save({ session });
        return res.status(410).json({ message: "Request expired." });
      }

      // ensure no other conflicting booking (including other active pendings)
      const conflict = await Booking.findOne(
        overlapQuery({
          coachId,
          start: booking.startUtc,
          end: booking.endUtc,
          now,
          excludeId: booking._id,
        }),
      ).session(session).lean();
      if (conflict) return res.status(409).json({ message: "Slot already taken." });

      // confirm this booking
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { status: "confirmed" }, $unset: { holdUntil: 1 } },
        { session },
      );

      // expire other overlapping pendings
      await Booking.updateMany(
        {
          coachId,
          status: "pending",
          holdUntil: { $gt: now },
          startUtc: { $lt: booking.endUtc },
          endUtc: { $gt: booking.startUtc },
          _id: { $ne: booking._id },
        },
        { $set: { status: "expired" }, $unset: { holdUntil: 1 } },
        { session },
      );

      // notify user (best effort)
      try {
        await notify({
          toUserId: booking.userId,
          type: "booking_approved",
          title: "Rezervasyon onaylandı",
          message: "Koç rezervasyonunu onayladı.",
          data: {
            bookingId: booking._id,
            startUtc: booking.startUtc,
            endUtc: booking.endUtc,
          },
        });
      } catch (e) {
        console.warn("notify(booking_approved) failed:", e?.message || e);
      }

      return res.json({ ok: true });
    };

    if (supportsTransactions()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(() => doWork(session));
        return; // response already sent
      } finally {
        session.endSession();
      }
    } else {
      return await doWork(null);
    }
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Slot just got booked." });
    }
    console.error("approve error:", err);
    return res.status(500).json({ message: "Failed to approve." });
  }
}

/**
 * POST /bookings/:id/decline
 * Requires: role=coach
 * Effect: pending -> declined; confirmed -> cancelled (coach-initiated cancel)
 */
export async function decline(req, res) {
  try {
    const coachId = String(req.user?._id || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, coachId });
    if (!booking) return res.status(404).json({ message: "Not found." });

    if (booking.status === "pending") {
      booking.status = "declined";
      booking.holdUntil = null;
      await booking.save();

      try {
        await notify({
          toUserId: booking.userId,
          type: "booking_declined",
          title: "Rezervasyon reddedildi",
          message: "Koç bu saat için uygun değil.",
          data: { bookingId: booking._id },
        });
      } catch (e) {
        console.warn("notify(booking_declined) failed:", e?.message || e);
      }
      return res.json({ ok: true });
    }

    if (booking.status === "confirmed") {
      booking.status = "cancelled"; // keep in sync with schema spelling
      booking.holdUntil = null;
      await booking.save();

      try {
        await notify({
          toUserId: booking.userId,
          type: "booking_cancelled",
          title: "Rezervasyon iptal edildi",
          message: "Koç rezervasyonu iptal etti.",
          data: { bookingId: booking._id },
        });
      } catch (e) {
        console.warn("notify(booking_cancelled) failed:", e?.message || e);
      }
      return res.json({ ok: true });
    }

    return res.status(400).json({ message: "Not declinable" });
  } catch (err) {
    console.error("decline error:", err);
    return res.status(500).json({ message: "Failed to decline." });
  }
}

/**
 * GET /bookings/pending
 * Requires: role=coach
 * Effect: list active pending requests (hold not expired)
 */
export async function listPendingForCoach(req, res) {
  try {
    const coachId = String(req.user?._id || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const items = await Booking.find({
      coachId,
      status: "pending",
      holdUntil: { $gt: now },
    })
      .sort({ startUtc: 1 })
      .populate("userId", "name email profilePicture");

    return res.json(items);
  } catch (err) {
    console.error("listPendingForCoach error:", err);
    return res.status(500).json({ message: "Failed to list pendings." });
  }
}

/**
 * GET /bookings/mine[?status=pending|confirmed|...]
 * Requires: role=user
 * Effect: list the user's bookings (optionally filtered by status)
 */
export async function listMine(req, res) {
  try {
    const userId = String(req.user?._id || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { status } = req.query;
    const q = { userId };
    if (status) q.status = status;

    const items = await Booking.find(q)
      .sort({ startUtc: -1 })
      .populate("coachId", "name email avatarUrl role");

    return res.json(items);
  } catch (err) {
    console.error("listMine error:", err);
    return res.status(500).json({ message: "Failed to list my bookings." });
  }
}

/**
 * POST /bookings/:id/cancel
 * Requires: role=user
 * Effect: user cancels their booking (policy: block cancel confirmed within <24h)
 */
export async function cancel(req, res) {
  try {
    const userId = String(req.user?._id || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, userId });
    if (!booking) return res.status(404).json({ message: "Not found." });

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "Cannot cancel this booking." });
    }

    // policy: disallow cancelling confirmed if <24h to start
    const tooLate = DateTime.fromJSDate(booking.startUtc) < DateTime.utc().plus({ hours: 24 });
    if (booking.status === "confirmed" && tooLate) {
      return res.status(400).json({ message: "Too late to cancel a confirmed booking (<24h)." });
    }

    booking.status = "cancelled";
    booking.holdUntil = null;
    await booking.save();

    try {
      await notify({
        toUserId: booking.coachId,
        type: "booking_cancelled",
        title: "Rezervasyon iptal edildi",
        message: "Danışan rezervasyonu iptal etti.",
        data: { bookingId: booking._id },
      });
    } catch (e) {
      console.warn("notify(booking_cancelled to coach) failed:", e?.message || e);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("cancel error:", err);
    return res.status(500).json({ message: "Failed to cancel." });
  }
}
