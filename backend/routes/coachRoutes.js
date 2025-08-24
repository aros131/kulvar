// routes/coachRoutes.js (ESM)
import { Router } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Coach from "../models/Coach.js";
import Program from "../models/Program.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";

import protect from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = Router();

/* ------------------------------ helpers ---------------------------------- */
const isObjId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjId = (id) => new mongoose.Types.ObjectId(id);

const toArray = (x) =>
  Array.isArray(x)
    ? x
    : typeof x === "string"
    ? x.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

const qParam = (req) =>
  (req.query.search || req.query.q || req.query.name || "").toString().trim();

const specsParam = (req) => {
  const raw = req.query.spec;
  const joined = Array.isArray(raw) ? raw.join(",") : raw || "";
  return joined.split(",").map((s) => s.trim()).filter(Boolean);
};

const paginate = (req) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Optional auth: attach req.userId if Bearer is valid (no 401s here) */
const maybeAuth = (req, _res, next) => {
  try {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) req.userId = decoded.id;
    }
  } catch {
    // ignore bad/expired token
  }
  next();
};

/* ------------------------------ SYNC-SELF --------------------------------- */
/**
 * POST /coaches/sync-self
 * Upserts a Coach doc for the logged-in coach (uses same _id as User).
 * MUST be declared before any "/:id" routes.
 */
router.post(
  "/sync-self",
  protect,
  roleMiddleware(["coach", "admin"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select(
        "name profilePicture role"
      );
      if (!user) return res.status(404).json({ message: "User not found" });

      const coach = await Coach.findOneAndUpdate(
        { _id: user._id }, // keep same id as User for easy joins
        {
          $setOnInsert: {
            name: user.name || "Koç",
            avatarUrl: user.profilePicture || "",
            role: user.role || "coach",
          },
        },
        { upsert: true, new: true }
      );

      return res.json({ coach });
    } catch (e) {
      console.error("syncSelfAsCoach error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ---------------------------------- LIST ---------------------------------- */
/** GET /coaches?search=&spec=&limit=&page=  -> { coaches, total, page, limit } */
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
          { specialization: { $regex: q, $options: "i" } },
          { specialization: { $elemMatch: { $regex: q, $options: "i" } } },
        ],
      });
    }

    if (specs.length) {
      const specOr = specs.flatMap((s) => [
        { specialization: { $regex: new RegExp(`^${esc(s)}$`, "i") } },
        {
          specialization: {
            $elemMatch: { $regex: new RegExp(`^${esc(s)}$`, "i") },
          },
        },
      ]);
      and.push({ $or: specOr });
    }

    const filters = and.length > 1 ? { $and: and } : and[0];

    const [docs, total] = await Promise.all([
      User.find(filters)
        .select(
          "name profilePicture avatar specialization city rating bio programsCount role tagline certifications"
        )
        .sort({ rating: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters),
    ]);

    const coaches = docs.map((d) => ({
      ...d,
      specialization: toArray(d.specialization),
    }));

    res.json({ coaches, total, page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------- ME/FOLLOWS (specific) ------------------------- */
/** GET /coaches/me/follows */
router.get("/me/follows", protect, async (req, res) => {
  try {
    const rows = await Follow.find({ userId: req.user._id })
      .populate({
        path: "coachId",
        select: "name avatar profilePicture city rating specialization",
      })
      .lean();

    const items = rows.map((r) => ({
      coachId: String(r.coachId?._id || r.coachId),
      name: r.coachId?.name,
      avatarUrl: r.coachId?.avatar || r.coachId?.profilePicture || "",
      city: r.coachId?.city || "",
      rating:
        typeof r.coachId?.rating === "number" ? r.coachId.rating : null,
      specialties: Array.isArray(r.coachId?.specialization)
        ? r.coachId.specialization
        : typeof r.coachId?.specialization === "string"
        ? r.coachId.specialization
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      followedAt: r.createdAt,
    }));

    res.json({ items, count: items.length });
  } catch (e) {
    console.error("GET /coaches/me/follows error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------- PROGRAM CARDS ------------------------------- */
/** GET /coaches/:id/programs?limit=&cursor=&status=Aktif */
router.get("/:id/programs", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const cursor = req.query.cursor;
    const status = req.query.status?.toString();

    const q = { coachId: id };
    if (status) q.status = status;
    if (cursor) {
      if (!isObjId(cursor)) return res.status(400).json({ message: "Invalid cursor" });
      q._id = { $lt: toObjId(cursor) };
    }

    const docs = await Program.find(q)
      .select("name description duration difficulty fitnessGoal price createdAt status")
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      durationWeeks: p.duration,   // Program schema uses `duration`
      difficulty: p.difficulty,    // "Başlangıç" | "Orta Düzey" | "İleri Seviye"
      goal: p.fitnessGoal,
      price: p.price ?? undefined,
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
/** GET /coaches/:id/reviews?limit=&cursor= */
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

/** POST /coaches/:id/reviews  -> create review (must be assigned to a program of that coach) */
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment = "", keywords } = req.body || {};

    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Gate: user must be assigned to at least one program of this coach
    const assigned = await Program.exists({ coachId: id, assignedClients: req.user._id });
    if (!assigned) {
      return res.status(403).json({ message: "Only clients of this coach can review." });
    }

    const doc = await Review.create({
      coachId: id,
      userId: req.user._id,
      rating: r,
      comment: String(comment || "").slice(0, 2000),
      keywords: Array.isArray(keywords) ? keywords.slice(0, 10) : undefined,
      verified: true,
    });

    // optionally update coach's average rating on User (cheap aggregate)
    const agg = await Review.aggregate([
      { $match: { coachId: toObjId(id) } },
      { $group: { _id: "$coachId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await User.updateOne({ _id: id }, { $set: { rating: Math.round(agg[0].avg * 10) / 10 } }).catch(() => {});
    }

    return res.status(201).json({
      id: String(doc._id),
      rating: doc.rating,
      comment: doc.comment,
      date: doc.createdAt?.toISOString() || new Date().toISOString(),
      verified: !!doc.verified,
    });
  } catch (e) {
    console.error("POST /coaches/:id/reviews error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------- FOLLOW / UNFOLLOW ---------------------------- */
router.put("/:id/follow", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const result = await Follow.updateOne(
      { userId: req.user._id, coachId: id },
      { $setOnInsert: { userId: req.user._id, coachId: id, createdAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      isFollowing: true,
      matched: result.matchedCount ?? 0,
      upserted: result.upsertedCount ?? 0,
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(200).json({ ok: true, isFollowing: true, matched: 1, upserted: 0 });
    }
    console.error("PUT /coaches/:id/follow error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/follow", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const r = await Follow.deleteOne({ userId: req.user._id, coachId: id });
    return res.status(200).json({ ok: true, isFollowing: false, deleted: r.deletedCount || 0 });
  } catch (e) {
    console.error("DELETE /coaches/:id/follow error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/follow", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const exists = await Follow.exists({ userId: req.user._id, coachId: id });
    res.json({ isFollowing: !!exists });
  } catch (e) {
    console.error("GET /coaches/:id/follow error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------- FOLLOWERS LIST ------------------------------ */
router.get("/:id/followers", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor;
    const withCount = req.query.withCount === "1";

    const q = { coachId: id };
    if (cursor) {
      if (!isObjId(cursor)) return res.status(400).json({ message: "Invalid cursor" });
      q._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await Follow.find(q)
      .sort({ _id: -1 })
      .limit(limit)
      .populate({ path: "userId", select: "name avatar profilePicture city" })
      .lean();

    const items = docs.map((f) => ({
      id: String(f.userId?._id || ""),
      name: f.userId?.name || "User",
      avatarUrl: f.userId?.avatar || f.userId?.profilePicture || "",
      city: f.userId?.city || "",
      since: f.createdAt ? new Date(f.createdAt).toISOString() : null,
    }));

    const payload = {
      items,
      nextCursor: docs.length === limit ? String(docs[docs.length - 1]._id) : null,
    };

    if (withCount) {
      payload.count = await Follow.countDocuments({ coachId: id }).catch(() => 0);
    }

    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------- ACTIVE CLIENTS (PUBLIC) ------------------------- */
router.get("/:id/active-clients", async (req, res) => {
  try {
    const coachId = req.params.id;
    const oid = mongoose.Types.ObjectId.isValid(coachId)
      ? new mongoose.Types.ObjectId(coachId)
      : null;

    const match = oid ? { coachId: oid } : { coachId };

    const result = await Program.aggregate([
      { $match: match },
      { $project: { assignedClients: 1 } },
      { $unwind: "$assignedClients" },
      {
        $group: {
          _id: {
            $cond: [
              { $isArray: "$assignedClients" },
              { $arrayElemAt: ["$assignedClients", 0] },
              { $ifNull: ["$assignedClients._id", "$assignedClients"] },
            ],
          },
        },
      },
      { $count: "count" },
    ]);

    const count = result?.[0]?.count ?? 0;
    res.json({ count });
  } catch (e) {
    console.error("active-clients error", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------- PROFILE --------------------------------- */
/** GET /coaches/:id  -> flat coach object */
router.get("/:id", maybeAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const doc = await User.findOne({ _id: id, role: { $regex: /^coach$/i } })
      .select(
        "name profilePicture avatar specialization city rating bio programsCount role certifications tagline languages"
      )
      .lean();
    if (!doc) return res.status(404).json({ message: "Coach not found" });

    const [reviewCount, followerCount, isFollowing] = await Promise.all([
      Review.countDocuments({ coachId: id }).catch(() => 0),
      Follow.countDocuments({ coachId: id }).catch(() => 0),
      (async () => {
        if (!req.userId) return false;
        try { return !!(await Follow.exists({ userId: req.userId, coachId: id })); }
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
      followerCount,
      clientsCount: doc.programsCount ?? undefined,
      specialties: Array.isArray(doc.specialization)
        ? doc.specialization
        : doc.specialization
        ? [doc.specialization]
        : [],
      certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
      bio: doc.bio || "",
      isFollowing,
      languages: Array.isArray(doc.languages) ? doc.languages : [],
    };

    res.json(coach);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
