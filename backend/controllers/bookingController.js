// controllers/bookingController.js
import mongoose from "mongoose";
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import { notify } from "../services/NotificationService.js";
import { getCoachAvailabilityConfig } from "../services/availability.js"; // for leadTimeMin, etc.

// --- helpers ---------------------------------------------------------

const HOLD_MS = 24 * 60 * 60 * 1000; // 24h

function asDateISO(iso) {
  const d = new Date(iso);
  return Number.isFinite(d.valueOf()) ? d : null;
}

function overlapQuery({ coachId, start, end, now, excludeId }) {
  const q = {
    coachId,
    $or: [
      // confirmed blocks always
      { status: "confirmed", startUtc: { $lt: end }, endUtc: { $gt: start } },
      // pending blocks only if still held
      { status: "pending", holdUntil: { $gt: now }, startUtc: { $lt: end }, endUtc: { $gt: start } },
    ],
  };
  if (excludeId) q._id = { $ne: excludeId };
  return q;
}

async function expireStalePendings(coachId, session) {
  const now = new Date();
  await Booking.updateMany(
    { coachId, status: "pending", holdUntil: { $lte: now } },
    { $set: { status: "expired" }, $unset: { holdUntil: 1 } },
    { session }
  );
}

function supportsTransactions() {
  // If connected to a replica set / mongos, transactions are supported
  // This heuristic avoids crashing on standalone dev mongod.
  const conn = mongoose.connection;
  return !!(conn && (conn.client?.topology?.s?.options?.replicaSet || conn.client?.topology?.description?.type === "ReplicaSetNoPrimary" || conn.client?.topology?.description?.type === "ReplicaSetWithPrimary"));
}

// --- controllers -----------------------------------------------------

/**
 * POST /bookings
 * Body: { coachId, startUtc, endUtc, meetingMode, location?, notes? }
 * Creates a PENDING booking (24h hold by default).
 */
export async function createPending(req, res) {
  try {
    const userId = String(req.user?._id || req.user || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { coachId, startUtc, endUtc, meetingMode, location, notes } = req.body || {};
    if (!coachId) return res.status(400).json({ message: "coachId is required" });
    if (!["in_person", "zoom"].includes(meetingMode)) {
      return res.status(400).json({ message: "meetingMode invalid" });
    }

    const start = asDateISO(startUtc);
    const end = asDateISO(endUtc);
    if (!start || !end || end <= start) return res.status(400).json({ message: "Invalid time range" });

    const { leadTimeMin = 12 * 60 } = await getCoachAvailabilityConfig(coachId);
    if (DateTime.fromJSDate(start, { zone: "utc" }) < DateTime.utc().plus({ minutes: leadTimeMin })) {
      return res.status(400).json({ message: "Slot is too soon to book." });
    }

    const now = new Date();
    const doWork = async (session) => {
      // 0) clean stale pendings so they stop blocking identical-slot creates
      await expireStalePendings(coachId, session);

      // 1) overlap check (confirmed & active pending)
      const conflict = await Booking.findOne(
        overlapQuery({ coachId, start, end, now })
      ).session(session).lean();

      if (conflict) return res.status(409).json({ message: "Slot already held or booked." });

      // 2) create pending hold
      const created = await Booking.create([{
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

      // 3) notify coach
      await notify({
        toUserId: coachId,
        type: "booking_request",
        title: "Yeni rezervasyon isteği",
        message: "Onaylamak için tıklayın.",
        data: { bookingId: created[0]._id, startUtc, endUtc, meetingMode, userId },
      });

      return res.status(201).json({ ok: true, bookingId: created[0]._id, status: "pending" });
    };

    if (supportsTransactions()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(() => doWork(session));
      } finally {
        session.endSession();
      }
    } else {
      await doWork(null);
    }
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Slot just got taken." });
    console.error("createPending error:", err);
    res.status(500).json({ message: "Failed to create booking." });
  }
}

/**
 * POST /bookings/:id/approve
 * Coach approves a pending booking -> becomes CONFIRMED.
 * Also expires other overlapping pendings.
 */
export async function approve(req, res) {
  try {
    const coachId = String(req.user?._id || req.user || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const now = new Date();

    const doWork = async (session) => {
      const booking = await Booking.findOne({ _id: id, coachId }).session(session);
      if (!booking) return res.status(404).json({ message: "Not found." });
      if (booking.status !== "pending") return res.status(400).json({ message: "Not pending." });

      if (booking.holdUntil && booking.holdUntil <= now) {
        booking.status = "expired";
        booking.holdUntil = null;
        await booking.save({ session });
        return res.status(410).json({ message: "Request expired." });
      }

      // Ensure no conflicting confirmed or active pending (other than self)
      const conflict = await Booking.findOne(
        overlapQuery({
          coachId,
          start: booking.startUtc,
          end: booking.endUtc,
          now,
          excludeId: booking._id,
        })
      ).session(session).lean();

      if (conflict) return res.status(409).json({ message: "Slot already taken." });

      // Confirm and clear hold
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { status: "confirmed" }, $unset: { holdUntil: 1 } },
        { session }
      );

      // Expire all other overlapping pendings for the same coach
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
        { session }
      );

      // notify user
      await notify({
        toUserId: booking.userId,
        type: "booking_approved",
        title: "Rezervasyon onaylandı",
        message: "Koç rezervasyonunu onayladı.",
        data: { bookingId: booking._id, startUtc: booking.startUtc, endUtc: booking.endUtc },
      });

      return res.json({ ok: true });
    };

    if (supportsTransactions()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(() => doWork(session));
      } finally {
        session.endSession();
      }
    } else {
      await doWork(null);
    }
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Slot just got booked." });
    console.error("approve error:", err);
    res.status(500).json({ message: "Failed to approve." });
  }
}

/**
 * POST /bookings/:id/decline
 * Pending → declined; Confirmed → cancelled (cancellation).
 * (Pick one spelling across BE/FE; model currently uses "cancelled")
 */
export async function decline(req, res) {
  try {
    const coachId = String(req.user?._id || req.user || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, coachId });
    if (!booking) return res.status(404).json({ message: "Not found." });

    if (booking.status === "pending") {
      booking.status = "declined";
      booking.holdUntil = null;
      await booking.save();

      await notify({
        toUserId: booking.userId,
        type: "booking_declined",
        title: "Rezervasyon reddedildi",
        message: "Koç bu saat için uygun değil.",
        data: { bookingId: booking._id },
      });
      return res.json({ ok: true });
    }

    if (booking.status === "confirmed") {
      booking.status = "cancelled"; // keep in sync with your schema spelling
      booking.holdUntil = null;
      await booking.save();

      await notify({
        toUserId: booking.userId,
        type: "booking_cancelled",
        title: "Rezervasyon iptal edildi",
        message: "Koç rezervasyonu iptal etti.",
        data: { bookingId: booking._id },
      });
      return res.json({ ok: true });
    }

    return res.status(400).json({ message: "Not declinable" });
  } catch (err) {
    console.error("decline error:", err);
    res.status(500).json({ message: "Failed to decline." });
  }
}

/**
 * GET /bookings/pending
 * Coach sees active pending requests (holdUntil in future)
 */
export async function listPendingForCoach(req, res) {
  try {
    const coachId = String(req.user?._id || req.user || "");
    if (!coachId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const items = await Booking.find({
      coachId,
      status: "pending",
      holdUntil: { $gt: now },
    }).sort({ startUtc: 1 });

    res.json(items);
  } catch (err) {
    console.error("listPendingForCoach error:", err);
    res.status(500).json({ message: "Failed to list pendings." });
  }
}
