import { Router } from "express";
import User from "../models/User.js";

const router = Router();

const toArray = (x) =>
  Array.isArray(x) ? x : (typeof x === "string" ? x.split(",").map(s => s.trim()).filter(Boolean) : []);

const qParam = (req) => (req.query.search || req.query.q || req.query.name || "").toString().trim();
const specsParam = (req) => {
  // supports: ?spec=yoga  OR  ?spec=yoga,hiit  OR repeated ?spec=yoga&spec=hiit
  const raw = req.query.spec;
  const joined = Array.isArray(raw) ? raw.join(",") : (raw || "");
  return joined.split(",").map(s => s.trim()).filter(Boolean);
};
const paginate = (req) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** GET /coaches?search=&spec=&limit=&page=  -> { coaches, total } */
router.get("/", async (req, res) => {
  try {
    const q = qParam(req);
    const specs = specsParam(req);           // ⬅️ NEW
    const { limit, page, skip } = paginate(req);

    const and = [{ role: { $regex: /^coach$/i } }];

    if (q) {
      and.push({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { city: { $regex: q, $options: "i" } },
          { specialization: { $regex: q, $options: "i" } },                         // when string
          { specialization: { $elemMatch: { $regex: q, $options: "i" } } },         // when array
        ],
      });
    }

    if (specs.length) {
      // ANY of the provided specs (exact, case-insensitive)
      const specOr = specs.flatMap((s) => [
        { specialization: { $regex: new RegExp(`^${esc(s)}$`, "i") } },             // string field
        { specialization: { $elemMatch: { $regex: new RegExp(`^${esc(s)}$`, "i") } } }, // array field
      ]);
      and.push({ $or: specOr });
    }

    const filters = and.length > 1 ? { $and: and } : and[0];

    const [docs, total] = await Promise.all([
      User.find(filters)
        .select("name profilePicture avatar specialization city rating bio programsCount role")
        .sort({ rating: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters),
    ]);

    const coaches = docs.map((d) => ({ ...d, specialization: toArray(d.specialization) }));
    res.json({ coaches, total, page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const coach = await User.findOne({ _id: req.params.id, role: { $regex: /^coach$/i } })
      .select("name profilePicture avatar specialization city rating bio programsCount role")
      .lean();
  if (!coach) return res.status(404).json({ message: "Coach not found" });
    coach.specialization = toArray(coach.specialization);
    res.json({ coach });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
