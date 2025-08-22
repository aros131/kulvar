// routes/meRoutes.js (ESM)
import { Router } from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Program from "../models/Program.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";

const router = Router();

const isObjId = (id) => mongoose.Types.ObjectId.isValid(id);
const toArray = (x) =>
  Array.isArray(x) ? x : (typeof x === "string" ? x.split(",").map(s => s.trim()).filter(Boolean) : []);

// All routes under /me require auth
router.use(protect);

/**
 * GET /me/coaches/:id
 * Returns everything the private coach page needs in one response:
 * { coach, programs, reviews }
 */
router.get("/coaches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const [doc, isFollowing, followerCount, progs, revs, reviewCount] = await Promise.all([
      User.findOne({ _id: id, role: { $regex: /^coach$/i } })
        .select("name profilePicture avatar specialization city rating bio programsCount role certifications tagline languages")
        .lean(),
      Follow.exists({ userId: req.user._id, coachId: id }),
      Follow.countDocuments({ coachId: id }).catch(() => 0),
      Program.find({ coachId: id })
        .select("name description duration difficulty fitnessGoal price")
        .sort({ _id: -1 })
        .limit(24)
        .lean(),
      Review.find({ coachId: id })
        .sort({ _id: -1 })
        .limit(50)
        .populate({ path: "userId", select: "name" })
        .lean(),
      Review.countDocuments({ coachId: id }).catch(() => 0),
    ]);

    if (!doc) return res.status(404).json({ message: "Coach not found" });

    const coach = {
      id: String(doc._id),
      name: doc.name,
      role: doc.role || "Coach",
      avatarUrl: doc.avatar || doc.profilePicture || "",
      location: doc.city || "",
      tagline: doc.tagline || "",
      rating: typeof doc.rating === "number" ? doc.rating : null,
      reviewCount,
      followerCount, // <- included
      clientsCount: doc.programsCount ?? undefined,
      specialties: toArray(doc.specialization),
      certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
      languages: Array.isArray(doc.languages) ? doc.languages : [],
      bio: doc.bio || "",
      isFollowing: !!isFollowing,
    };

    const programs = progs.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      durationWeeks: p.duration,     // your schema uses 'duration' (weeks)
      difficulty: p.difficulty,      // "Başlangıç" | "Orta Düzey" | "İleri Seviye"
      goal: p.fitnessGoal,
      price: p.price ?? undefined,
    }));

    const reviews = revs.map((r) => ({
      id: String(r._id),
      author: r.userId?.name || "Anonymous",
      rating: r.rating,
      date: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      comment: r.comment ?? "",
      keywords: r.keywords ?? [],
      verified: !!r.verified,
    }));

    return res.json({ coach, programs, reviews });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Private follow endpoints (aliases under /me)
 * GET  /me/coaches/:id/follow   -> { isFollowing }
 * PUT  /me/coaches/:id/follow   -> 204
 * DELETE /me/coaches/:id/follow -> 204
 */
router.get("/coaches/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    const exists = await Follow.exists({ userId: req.user._id, coachId: id });
    res.json({ isFollowing: !!exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/coaches/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    await Follow.updateOne(
      { userId: req.user._id, coachId: id },
      { $setOnInsert: { userId: req.user._id, coachId: id, createdAt: new Date() } },
      { upsert: true }
    );
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    // duplicate key would be fine with updateOne+upsert; included for safety
    if (e?.code === 11000) return res.sendStatus(204);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/coaches/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    await Follow.deleteOne({ userId: req.user._id, coachId: id });
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/** (Optional) List coaches the current user follows */
router.get("/following", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const cursor = req.query.cursor;

    const q = { userId: req.user._id };
    if (cursor) {
      if (!isObjId(cursor)) return res.status(400).json({ message: "Invalid cursor" });
      q._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const follows = await Follow.find(q)
      .sort({ _id: -1 })
      .limit(limit)
      .populate({
        path: "coachId",
        select: "name avatar profilePicture city rating tagline specialization programsCount role",
        match: { role: { $regex: /^coach$/i } },
      })
      .lean();

    const items = follows
      .map((f) => f.coachId)
      .filter(Boolean)
      .map((c) => ({
        id: String(c._id),
        name: c.name,
        avatarUrl: c.avatar || c.profilePicture || "",
        city: c.city || "",
        rating: typeof c.rating === "number" ? c.rating : null,
        tagline: c.tagline || "",
        specialties: Array.isArray(c.specialization) ? c.specialization : (c.specialization ? [c.specialization] : []),
        programsCount: c.programsCount ?? undefined,
      }));

    res.json({
      items,
      nextCursor: follows.length === limit ? String(follows[follows.length - 1]._id) : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
