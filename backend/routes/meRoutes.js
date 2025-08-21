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
 * Returns everything the private coach page needs in **one** response:
 * { coach, programs, reviews }
 */
router.get("/coaches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const [doc, isFollowing, progs, revs] = await Promise.all([
      User.findOne({ _id: id, role: { $regex: /^coach$/i } })
        .select("name profilePicture avatar specialization city rating bio programsCount role certifications tagline languages")
        .lean(),
      Follow.exists({ userId: req.user.id, coachId: id }),
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
      reviewCount: await Review.countDocuments({ coachId: id }).catch(() => 0),
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
      durationWeeks: p.duration,    // your schema uses 'duration' (weeks)
      difficulty: p.difficulty,     // "Başlangıç" | "Orta Düzey" | "İleri Seviye"
      goal: p.fitnessGoal,
      price: p.price ?? undefined,
      // no images in private page (text-only)
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
 * Optional aliases (private versions) if you want:
 * GET /me/coaches/:id/follow   -> { isFollowing }
 * PUT /me/coaches/:id/follow   -> 204
 * DELETE /me/coaches/:id/follow-> 204
 * (These simply proxy to the existing /coaches/:id/follow handlers if you prefer.)
 */
router.get("/coaches/:id/follow", async (req, res) => {
  const exists = await Follow.exists({ userId: req.user.id, coachId: req.params.id });
  res.json({ isFollowing: !!exists });
});

router.put("/coaches/:id/follow", async (req, res) => {
  await Follow.updateOne(
    { userId: req.user.id, coachId: req.params.id },
    { $setOnInsert: { userId: req.user.id, coachId: req.params.id, createdAt: new Date() } },
    { upsert: true }
  );
  res.sendStatus(204);
});

router.delete("/coaches/:id/follow", async (req, res) => {
  await Follow.deleteOne({ userId: req.user.id, coachId: req.params.id });
  res.sendStatus(204);
});

export default router;
