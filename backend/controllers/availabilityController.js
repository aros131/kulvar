import Availability from "../models/Availability.js";

export async function getMyRules(req, res) {
  const doc = await Availability.findOne({ coachId: req.user._id });
  return res.json(doc?.rules ?? []);
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
  return res.json({ ok: true, count: doc.rules.length });
}
