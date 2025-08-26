import { DateTime } from "luxon";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js"; // optional filter out taken slots

export async function getMyRules(req, res) {
  const doc = await Availability.findOne({ coachId: req.user._id });
  res.json(doc?.rules ?? []);
}

export async function putMyRules(req, res) {
  const { rules } = req.body || {};
  if (!Array.isArray(rules)) return res.status(400).json({ message: "rules[] required" });

  for (const r of rules) {
    if (!Array.isArray(r.weekdays) || typeof r.startMin !== "number" || typeof r.endMin !== "number") {
      return res.status(400).json({ message: "invalid rule" });
    }
    if (r.endMin <= r.startMin) return res.status(400).json({ message: "endMin must be > startMin" });
  }

  const doc = await Availability.findOneAndUpdate(
    { coachId: req.user._id },
    { $set: { rules, coachId: req.user._id } },
    { new: true, upsert: true }
  );
  res.json({ ok: true, count: doc.rules.length });
}

// Public: list available slots generated from weekly rules
export async function publicListAvailability(req, res) {
  const coachId = req.params.id;
  const { from, to, serviceMin = 30 } = req.query;

  if (!from || !to) return res.status(400).json({ message: "from & to ISO required" });

  const conf = await Availability.findOne({ coachId });
  if (!conf || !conf.rules?.length) return res.json([]); // no rules = no slots
  const tz = conf.timezone || "Europe/Istanbul";
  const service = Number(serviceMin) || 30;

  const start = DateTime.fromISO(from, { zone: "utc" }).startOf("minute");
  const end   = DateTime.fromISO(to,   { zone: "utc" }).startOf("minute");
  if (!start.isValid || !end.isValid || end <= start) return res.status(400).json({ message: "invalid range" });

  // Optional: filter out taken slots by existing bookings
  const bookings = await Booking.find({
    coachId,
    status: { $in: ["pending", "confirmed"] },
    startUtc: { $lt: end.toJSDate() },
    endUtc:   { $gt: start.toJSDate() },
  }).select("startUtc endUtc");

  const isTaken = (slotStart, slotEnd) =>
    bookings.some(b => slotStart < DateTime.fromJSDate(b.endUtc) && slotEnd > DateTime.fromJSDate(b.startUtc));

  const out = [];
  // iterate each day in [start, end)
  let cursor = start.set({ hour: 0, minute: 0 });
  while (cursor < end) {
    const dayLocal = cursor.setZone(tz);
    const weekday = dayLocal.weekday % 7; // luxon: Mon=1..Sun=7 -> convert Sun=0
    const todayRules = conf.rules.filter(r => r.weekdays.includes(weekday));

    for (const r of todayRules) {
      // build local day window
      const dayStartLocal = dayLocal.plus({ minutes: r.startMin });
      const dayEndLocal   = dayLocal.plus({ minutes: r.endMin });
      let s = dayStartLocal;

      while (s.plus({ minutes: service }) <= dayEndLocal) {
        const e = s.plus({ minutes: service });
        // convert to UTC and clamp to requested range
        const sUtc = s.toUTC();
        const eUtc = e.toUTC();
        if (sUtc >= start && eUtc <= end) {
          if (!isTaken(sUtc, eUtc)) {
            out.push({ startUtc: sUtc.toISO(), endUtc: eUtc.toISO() });
          }
        }
        s = s.plus({ minutes: r.stepMin || 30 });
      }
    }
    cursor = cursor.plus({ days: 1 });
  }

  res.json(out);
}
