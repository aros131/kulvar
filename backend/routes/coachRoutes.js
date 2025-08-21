// routes/coaches.js  (ESM)
import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Program from "../models/Program.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* --------------------------------- helpers -------------------------------- */
const isObjId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjId = (id) => new mongoose.Types.ObjectId(id);

const toArray = (x) =>
  Array.isArray(x) ? x : (typeof x === "string" ? x.split(",").map(s => s.trim()).filter(Boolean) : []);

const qParam = (req) => (req.query.search || req.query.q || req.query.name || "").toString().trim();

const specsParam = (req) => {
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

const pickCoverImage = (assets = []) => {
  if (!Array.isArray(assets) || !assets.length) return "";
  const imgWithThumb = assets.find(a => a?.kind === "image" && a?.thumbnailUrl);
  const img = imgWithThumb || assets.find(a => a?.kind === "image");
  return img?.thumbnailUrl || img?.url || "";
};

/* ---------------------------------- LIST ---------------------------------- */
/** GET /coaches?search=&spec=&limit=&page=
 *  -> { coaches, total, page, limit }
 */
router.get("/", async (req, res) => {
  try {
    const q = qParam(req);
    const specs = specsParam(req);
    const { limit, page, skip } = paginate(req);

    const and = [{ role: { $regex: /^coach$/i } }];

    if (q) {
      and.push({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { city: { $regex: q, $options: "i" } },
          { specialization: { $regex: q, $options: "i" } },                 // string field
          { specialization: { $elemMatch: { $regex: q, $options: "i" } } }, // array field
        ],
      });
    }

    if (specs.length) {
      const specOr = specs.flatMap((s) => [
        { specialization: { $regex: new RegExp(`^${esc(s)}$`, "i") } },
        { specialization: { $elemMatch: { $regex: new RegExp(`^${esc(s)}$`, "i") } } },
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

/* -------------------------------- PROFILE --------------------------------- */
/** GET /coaches/:id  -> flat coach object (not { coach }) */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const doc = await User.findOne({ _id: id, role: { $regex: /^coach$/i } })
      .select("name profilePicture avatar specialization city rating bio programsCount role certifications tagline languages")
      .lean();

    if (!doc) return res.status(404).json({ message: "Coach not found" });

    const [reviewCount, isFollowing] = await Promise.all([
      Review.countDocuments({ coachId: id }).catch(() => 0),
      (async () => {
        if (!req.user) return false;
        try { return !!(await Follow.exists({ userId: req.user.id, coachId: id })); }
        catch { return false; }
      })(),
    ]);

    const coach = {
      id: String(doc._id),
      name: doc.name,
      role: doc.role || "Coach",
      avatarUrl: doc.avatar || doc.profilePicture || "",
      location: doc.city || "",
      tagline: doc.tagline || "",
      rating: typeof doc.rating === "number" ? doc.rating : null,
      reviewCount,
      clientsCount: doc.programsCount ?? undefined,
      specialties: toArray(doc.specialization),
      certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
      bio: doc.bio || "",
      isFollowing,
      // languages intentionally omitted in v1 UI per your scope, but available here:
      languages: Array.isArray(doc.languages) ? doc.languages : [],
    };

    res.json(coach);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------- PROGRAM CARDS ------------------------------- */
/** GET /coaches/:id/programs?limit=&cursor=&status=Aktif
 *  -> { items, nextCursor }
 */
router.get("/:id/programs", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const cursor = req.query.cursor;
    const status = req.query.status?.toString(); // optional: "Aktif" | "Tamamlandı" | "Durduruldu"

    const q = { coachId: id };
    if (status) q.status = status;
    if (cursor) {
      if (!isObjId(cursor)) return res.status(400).json({ message: "Invalid cursor" });
      q._id = { $lt: toObjId(cursor) };
    }

    const docs = await Program.find(q)
      .select("name description duration difficulty fitnessGoal assets price createdAt status")
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      durationWeeks: p.duration,           // your schema uses `duration` (weeks)
      difficulty: p.difficulty,            // "Başlangıç" | "Orta Düzey" | "İleri Seviye"
      goal: p.fitnessGoal,                 // Turkish goal labels
      price: p.price ?? undefined,         // if present in your schema
      image: pickCoverImage(p.assets),     // from Firebase assets
    }));

    res.json({
      items,
      nextCursor: docs.length === limit ? String(docs[docs.length - 1]._id) : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* --------------------------------- REVIEWS --------------------------------- */
/** GET /coaches/:id/reviews?limit=&cursor=
 *  -> { items, nextCursor }
 */
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    const q = { coachId: id };
    if (cursor) {
      if (!isObjId(cursor)) return res.status(400).json({ message: "Invalid cursor" });
      q._id = { $lt: toObjId(cursor) };
    }

    const revs = await Review.find(q)
      .sort({ _id: -1 })
      .limit(limit)
      .populate({ path: "userId", select: "name" })
      .lean();

    const items = revs.map((r) => ({
      id: String(r._id),
      author: r.userId?.name || "Anonymous",
      rating: r.rating,
      date: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      comment: r.comment ?? "",
      keywords: r.keywords ?? [],
      verified: !!r.verified,
    }));

    res.json({
      items,
      nextCursor: revs.length === limit ? String(revs[revs.length - 1]._id) : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------- FOLLOW / UNFOLLOW ---------------------------- */
/** PUT /coaches/:id/follow   -> 204 (idempotent) */
router.put("/:id/follow", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    await Follow.updateOne(
      { userId: req.user.id, coachId: id },
      { $setOnInsert: { userId: req.user.id, coachId: id, createdAt: new Date() } },
      { upsert: true }
    );
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    // 11000 means duplicate key — it's fine (already following)
    if (e?.code === 11000) return res.sendStatus(204);
    res.status(500).json({ message: "Server error" });
  }
});

/** DELETE /coaches/:id/follow -> 204 */
router.delete("/:id/follow", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    await Follow.deleteOne({ userId: req.user.id, coachId: id });
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/** GET /coaches/:id/follow -> { isFollowing } */
router.get("/:id/follow", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const exists = await Follow.exists({ userId: req.user.id, coachId: id });
    res.json({ isFollowing: !!exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
