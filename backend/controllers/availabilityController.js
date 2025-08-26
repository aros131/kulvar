// controllers/availabilityController.js (ESM)
import { DateTime, Interval } from "luxon";
import AvailabilityRule from "../models/AvailabilityRule.js";
import AvailabilityOverride from "../models/AvailabilityOverride.js";
import AvailabilityBlackout from "../models/AvailabilityBlackout.js";
import Booking from "../models/Booking.js";

const STEP_FALLBACK = 30;
const DEFAULT_TZ = "Europe/Istanbul"; // change if you store tz per coach

export async function getAvailability(req, res) {
  try {
    const { id } = req.params; // coachId
    const serviceMin = Math.max(5, Math.min(480, Number(req.query.serviceMin ?? 30)));
    const fromIso = req.query.from || new Date().toISOString();
    const toIso   = req.query.to   || new Date(Date.now() + 21*24*3600*1000).toISOString();

    // TODO: load coach's tz from your User/Coach model if you store it.
    const coachTz = DEFAULT_TZ;

    const [rules, overrides, blackouts, bookings] = await Promise.all([
      AvailabilityRule.find({ coachId: id }).lean(),
      AvailabilityOverride.find({ coachId: id }).lean(),
      AvailabilityBlackout.find({ coachId: id }).lean(),
      Booking.find({
        coachId: id,
        startUtc: { $lt: new Date(toIso) },
        endUtc:   { $gt: new Date(fromIso) },
        $or: [
          { status: "confirmed" },
          { status: "pending", holdUntil: { $gt: new Date() } }, // ignore stale pending
        ],
      }).select({ startUtc: 1, endUtc: 1, _id: 0 }).lean(),
    ]);

    const slots = generateSlots({
      fromIso, toIso, serviceMin,
      coachTz,
      rules: rules.map(r => ({ weekdays: r.weekdays, startMin: r.startMin, endMin: r.endMin, stepMin: r.stepMin || STEP_FALLBACK })),
      overrides: overrides.map(o => ({ date: o.date, kind: o.kind, intervals: o.intervals || [] })),
      blackouts: blackouts.map(b => ({ startDate: b.startDate, endDate: b.endDate })),
      bookings: bookings.map(b => ({ startUtc: b.startUtc.toISOString(), endUtc: b.endUtc.toISOString() })),
      leadMin: 120,
    });

    res.json(slots); // always 200
  } catch (e) {
    console.error("getAvailability error:", e);
    res.status(500).json({ message: "failed_to_generate_availability" });
  }
}

function generateSlots({ fromIso, toIso, serviceMin, coachTz, rules, overrides, blackouts, bookings, leadMin = 120 }) {
  const fromUtc = DateTime.fromISO(fromIso, { zone: "utc" });
  const toUtc   = DateTime.fromISO(toIso,   { zone: "utc" });
  const nowLocal = DateTime.now().setZone(coachTz).plus({ minutes: leadMin });

  const out = [];
  for (let day = fromUtc.setZone(coachTz).startOf("day"); day <= toUtc.setZone(coachTz).endOf("day"); day = day.plus({ days: 1 })) {
    const date = day.toISODate();
    const weekday = day.weekday % 7; // 1..7 -> 0..6

    let intervals = rules
      .filter(r => r.weekdays.includes(weekday))
      .map(r => ({ startMin: r.startMin, endMin: r.endMin, stepMin: r.stepMin || STEP_FALLBACK }));

    const ov = overrides.find(o => o.date === date);
    if (ov) {
      if (ov.kind === "closed") intervals = [];
      else intervals = (ov.intervals || []).map(x => ({ ...x, stepMin: STEP_FALLBACK }));
    }

    if (blackouts.some(b => date >= b.startDate && date <= b.endDate)) intervals = [];
    if (!intervals.length) continue;

    const dayInterval = Interval.fromDateTimes(day.startOf("day"), day.endOf("day"));
    const busyLocal = bookings
      .map(b => Interval.fromDateTimes(
        DateTime.fromISO(b.startUtc, { zone: "utc" }).setZone(coachTz),
        DateTime.fromISO(b.endUtc,   { zone: "utc" }).setZone(coachTz)
      ))
      .filter(i => i.isValid && i.overlaps(dayInterval));

    for (const { startMin, endMin, stepMin } of intervals) {
      const blockStart = day.plus({ minutes: startMin });
      const blockEnd   = day.plus({ minutes: endMin });
      for (let start = blockStart; start.plus({ minutes: serviceMin }) <= blockEnd; start = start.plus({ minutes: stepMin })) {
        const end = start.plus({ minutes: serviceMin });
        if (start < nowLocal) continue;
        const candidate = Interval.fromDateTimes(start, end);
        if (busyLocal.some(b => b.overlaps(candidate))) continue;
        out.push({ startUtc: start.toUTC().toISO(), endUtc: end.toUTC().toISO() });
      }
    }
  }
  out.sort((a,b)=> DateTime.fromISO(a.startUtc).toMillis() - DateTime.fromISO(b.startUtc).toMillis());
  return out;
}
