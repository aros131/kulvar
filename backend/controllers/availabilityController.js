// controllers/availabilityController.js
export async function publicListAvailability(req, res) {
  try {
    const coachId = req.params.id;
    const { from, to, serviceMin = 30 } = req.query;
    if (!from || !to) return res.status(400).json({ message: "Query params 'from' & 'to' (ISO) are required" });

    const rangeStartUtc = DateTime.fromISO(from, { zone: "utc" }).startOf("minute");
    const rangeEndUtc   = DateTime.fromISO(to,   { zone: "utc" }).startOf("minute");
    if (!rangeStartUtc.isValid || !rangeEndUtc.isValid || rangeEndUtc <= rangeStartUtc) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conf = await Availability.findOne({ coachId });
    if (!conf?.rules?.length) return res.json([]);

    const tz = conf.timezone || "Europe/Istanbul";
    const service = Math.max(5, Number(serviceMin) || 30);

    // only block active pendings + confirmed
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

    // ✅ iterate by LOCAL days, not UTC days
    let cursorLocal = rangeStartUtc.setZone(tz).startOf("day");
    const endLocal  = rangeEndUtc.setZone(tz).endOf("day");

    while (cursorLocal <= endLocal) {
      const weekday0to6 = cursorLocal.weekday % 7; // 1..7 -> 0..6 (Sun=0)
      for (const rule of conf.rules.filter(r => r.weekdays.includes(weekday0to6))) {
        const step = Math.max(5, Number(rule.stepMin) || 30);

        // build local day boundaries
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

        // walk LOCAL timeline; convert each slot to UTC
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
