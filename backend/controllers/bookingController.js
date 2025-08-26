// controllers/bookingController.js
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import { notify } from "../services/NotificationService.js"; // wraps your existing notification routes
import { getCoachAvailabilityConfig } from "../services/availability.js";      // your leadTime/buffer/etc.

export async function createPending(req, res) {
  try {
    const { coachId, startUtc, endUtc, meetingMode, location } = req.body;
    const { leadTimeMin = 12 * 60 } = await getCoachAvailabilityConfig(coachId);

    // lead time check
    const start = DateTime.fromISO(startUtc, { zone: "utc" });
    if (start < DateTime.utc().plus({ minutes: leadTimeMin })) {
      return res.status(400).json({ message: "Slot is too soon to book." });
    }

    const doc = await Booking.create({
      coachId,
      userId: req.user._id,
      startUtc,
      endUtc,
      meetingMode,
      location,
      status: "pending",
    });

    // notify coach
    await notify({
      toUserId: coachId,
      type: "booking_request",
      title: "Yeni rezervasyon isteği",
      message: "Onaylamak için tıklayın.",
      data: { bookingId: doc._id, startUtc, endUtc, meetingMode, userId: req.user._id },
    });

    res.status(201).json({ ok: true, bookingId: doc._id, status: "pending" });
  } catch (err) {
    // duplicate key => slot already held/booked
    if (err?.code === 11000) return res.status(409).json({ message: "Slot just got taken." });
    console.error(err);
    res.status(500).json({ message: "Failed to create booking." });
  }
}

export async function approve(req, res) {
  try {
    const { id } = req.params;
    // only allow coach who owns the booking to approve
    const booking = await Booking.findOne({ _id: id, coachId: req.user._id });

    if (!booking) return res.status(404).json({ message: "Not found." });
    if (booking.status !== "pending") return res.status(400).json({ message: "Not pending." });

    // expire check
    if (booking.holdUntil && DateTime.fromJSDate(booking.holdUntil) < DateTime.utc()) {
      booking.status = "expired";
      await booking.save();
      return res.status(410).json({ message: "Request expired." });
    }

    // confirm (unique index guarantees no double-book)
    booking.status = "confirmed";
    await booking.save();

    // notify user
    await notify({
      toUserId: booking.userId,
      type: "booking_approved",
      title: "Rezervasyon onaylandı",
      message: "Koç rezervasyonunu onayladı.",
      data: { bookingId: booking._id, startUtc: booking.startUtc, endUtc: booking.endUtc },
    });

    return res.json({ ok: true });
  } catch (err) {
    // handle rare race: duplicate unique on confirm
    if (err?.code === 11000) return res.status(409).json({ message: "Slot just got booked." });
    console.error(err);
    res.status(500).json({ message: "Failed to approve." });
  }
}

export async function decline(req, res) {
  const { id } = req.params;
  const booking = await Booking.findOne({ _id: id, coachId: req.user._id });
  if (!booking) return res.status(404).json({ message: "Not found." });
  if (booking.status !== "pending") return res.status(400).json({ message: "Not pending." });

  booking.status = "declined";
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

export async function listPendingForCoach(req, res) {
  const items = await Booking.find({
    coachId: req.user._id,
    status: "pending",
    holdUntil: { $gt: new Date() },
  }).sort({ startUtc: 1 });
  res.json(items);
}
