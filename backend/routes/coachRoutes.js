import { Router } from "express";
import User from "../models/User.js";

const router = Router();

// normalize specialization to an array (handles string, array, missing)
const toArray = (x) => Array.isArray(x)
  ? x
  : (typeof x === "string" ? x.split(",").map(s => s.trim()).filter(Boolean) : []);

// helpers
const qParam = (req) => (req.query.search || req.query.q || req.query.name || "").toString().trim();
const paginate = (req) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

/** GET /coaches (because mounted at '/coaches')
 *  Optional: ?search=, ?q=, ?name=, ?limit=, ?page=
 *  Response: { coaches: [...], total }
 */
router.get("/", async (req, res) => {
  try {
    const q = qParam(req);
    const { limit, skip } = paginate(req);

    // only coaches (case-insensitive)
    const roleFilter = { role: { $regex: /^coach$/i } };

    const filters = q
      ? {
          $and: [
            roleFilter,
            {
              $or: [
                { name: { $regex: q, $options: "i" } },
                { city: { $regex: q, $options: "i" } },
                { specialization: { $regex: q, $options: "i" } }, // when string
                { specialization: { $elemMatch: { $regex: q, $options: "i" } } }, // when array
              ],
            },
          ],
        }
      : roleFilter;

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
    res.json({ coaches, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/** GET /coaches/:id  -> { coach } */
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

export default router;   // ⬅⬅⬅ IMPORTANT
