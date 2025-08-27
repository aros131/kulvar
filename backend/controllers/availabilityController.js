// controllers/availabilityController.js
import { DateTime } from "luxon";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";

/** GET /dashboard/me/availability/rules (coach, auth) */
export async function getMyRules(req, res) {
  const doc = await Availability.findOne({ coachId: req.user._id }).lean();
  return res.json(doc?.rules ?? []);
}

/** PUT /dashboard/me/availability/rules (coach, auth) */
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
  return res.json({ ok: true, count: doc.rules.length });
}

/** GET /coaches/:id/availability?from&to&serviceMin */
export async function publicListAvailability(req, res) {
  try {
    const coachId = req.params.id;
    const { from, to, serviceMin = 30 } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Query params 'from' & 'to' (ISO) are required" });
    }

    const rangeStartUtc = DateTime.fromISO(from, { zone: "utc" }).startOf("minute");
    const rangeEndUtc   = DateTime.fromISO(to,   { zone: "utc" }).startOf("minute");
    if (!rangeStartUtc.isValid || !rangeEndUtc.isValid || rangeEndUtc <= rangeStartUtc) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conf = await Availability.findOne({ coachId }).lean();
    if (!conf?.rules?.length) return res.json([]);

    const tz = conf.timezone || "Europe/Istanbul";
    const service = Math.max(5, Number(serviceMin) || 30);

    // block confirmed and still-held pendings only
    const now = new Date();
    const existing = await Booking.find({
      coachId,
      $or: [
        { status: "confirmed" },
        { status: "pending", holdUntil: { $gt: now } },
      ],
      startUtc: { $lt: rangeEndUtc.toJSDate() },
      endUtc:   { $gt: rangeStartUtc.toJSDate() },
    }).select("startUtc endUtc").lean();

    const overlaps = (sUtc, eUtc) =>
      existing.some(b =>
        sUtc < DateTime.fromJSDate(b.endUtc) &&
        eUtc > DateTime.fromJSDate(b.startUtc)
      );

    const out = [];

    // Iterate by the COACH'S LOCAL days to avoid DST/timezone shifts
    let cursorLocal = rangeStartUtc.setZone(tz).startOf("day");
    const endLocal  = rangeEndUtc.setZone(tz).endOf("day");

    while (cursorLocal <= endLocal) {
      // Luxon: Monday=1 .. Sunday=7; map Sunday->0 for our rules 0..6
      const weekday0to6 = cursorLocal.weekday % 7;

      for (const rule of conf.rules.filter(r => r.weekdays.includes(weekday0to6))) {
        const step = Math.max(5, Number(rule.stepMin) || 30);

        const dayStartLocal = cursorLocal.set({
          hour: Math.floor(rule.startMin / 60),
          minute: rule.startMin % 60,
          second: 0, millisecond: 0,
        });
        const dayEndLocal = cursorLocal.set({
          hour: Math.floor(rule.endMin / 60),
          minute: rule.endMin % 60,
          second: 0, millisecond: 0,
        });

        for (let sLocal = dayStartLocal; sLocal.plus({ minutes: service }) <= dayEndLocal; sLocal = sLocal.plus({ minutes: step })) {
          const eLocal = sLocal.plus({ minutes: service });
          const sUtc = sLocal.toUTC();
          const eUtc = eLocal.toUTC();

          if (sUtc >= rangeStartUtc && eUtc <= rangeEndUtc && !overlaps(sUtc, eUtc)) {
            out.push({ startUtc: sUtc.toISO(), endUtc: eUtc.toISO() });
          }
        }
      }
      cursorLocal = cursorLocal.plus({ days: 1 });
    }

    out.sort((a, b) => DateTime.fromISO(a.startUtc).toMillis() - DateTime.fromISO(b.startUtc).toMillis());
    res.json(out);
  } catch (err) {
    console.error("publicListAvailability error:", err);
    res.status(500).json({ message: "Failed to compute availability" });
  }
}
