// backend/controllers/availabilityController.js
import { DateTime } from "luxon";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";

/** GET /dashboard/me/availability/rules (coach, auth) */
export async function getMyRules(req, res) {
  const doc = await Availability.findOne({ coachId: req.user._id });
  return res.json(doc?.rules ?? []);
}

/** PUT /dashboard/me/availability/rules (coach, auth) */
export async function putMyRules(req, res) {
  const { rules } = req.body || {};
  if (!Array.isArray(rules)) {
    return res.status(400).json({ message: "rules[] required" });
  }
  for (const r of rules) {
    if (!Array.isArray(r.weekdays) || typeof r.startMin !== "number" || typeof r.endMin !== "number") {
      return res.status(400).json({ message: "invalid rule" });
    }
    if (r.endMin <= r.startMin) {
      return res.status(400).json({ message: "endMin must be > startMin" });
    }
  }

  const doc = await Availability.findOneAndUpdate(
    { coachId: req.user._id },
    { $set: { rules, coachId: req.user._id } },
    { new: true, upsert: true }
  );
  return res.json({ ok: true, count: doc.rules.length });
}

/** GET /coaches/:id/availability (public) */
export async function publicListAvailability(req, res) {
  try {
    const coachId = req.params.id;
    const { from, to, serviceMin = 30 } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Query params 'from' & 'to' (ISO) are required" });
    }

    const rangeStart = DateTime.fromISO(from, { zone: "utc" }).startOf("minute");
    const rangeEnd   = DateTime.fromISO(to,   { zone: "utc" }).startOf("minute");
    if (!rangeStart.isValid || !rangeEnd.isValid || rangeEnd <= rangeStart) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conf = await Availability.findOne({ coachId });
    if (!conf?.rules?.length) return res.json([]);

    const tz = conf.timezone || "Europe/Istanbul";
    const service = Math.max(5, Number(serviceMin) || 30);

    // exclude already pending/confirmed bookings that overlap the window
    const existing = await Booking.find({
      coachId,
      status: { $in: ["pending", "confirmed"] },
      startUtc: { $lt: rangeEnd.toJSDate() },
      endUtc:   { $gt: rangeStart.toJSDate() },
    }).select("startUtc endUtc");

    const overlaps = (sUtc, eUtc) =>
      existing.some(b => sUtc < DateTime.fromJSDate(b.endUtc) && eUtc > DateTime.fromJSDate(b.startUtc));

    const out = [];
    let cursor = rangeStart.startOf("day");
    while (cursor < rangeEnd) {
      const dayLocal = cursor.setZone(tz);
      const weekday0to6 = dayLocal.weekday % 7; // Mon..Sun(7)->Sun=0..Sat=6

      for (const rule of conf.rules.filter(r => r.weekdays.includes(weekday0to6))) {
        const step = Math.max(5, Number(rule.stepMin) || 30);
        let s = dayLocal.plus({ minutes: rule.startMin });
        const dayEnd = dayLocal.plus({ minutes: rule.endMin });

        while (s.plus({ minutes: service }) <= dayEnd) {
          const e = s.plus({ minutes: service });
          const sUtc = s.toUTC();
          const eUtc = e.toUTC();
          if (sUtc >= rangeStart && eUtc <= rangeEnd && !overlaps(sUtc, eUtc)) {
            out.push({ startUtc: sUtc.toISO(), endUtc: eUtc.toISO() });
          }
          s = s.plus({ minutes: step });
        }
      }
      cursor = cursor.plus({ days: 1 });
    }

    res.json(out);
  } catch (err) {
    console.error("publicListAvailability error:", err);
    res.status(500).json({ message: "Failed to compute availability" });
  }
}
