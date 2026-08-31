// controllers/coachController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Program from "../models/Program.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";

/* ------------------------------- helpers ---------------------------------- */
const isObjId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjId = (id) => new mongoose.Types.ObjectId(id);

const toArray = (x) =>
  Array.isArray(x) ? x : (typeof x === "string" ? x.split(",").map(s => s.trim()).filter(Boolean) : []);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pickCoverImage = (assets = []) => {
  if (!Array.isArray(assets) || !assets.length) return "";
  const imgWithThumb = assets.find(a => a?.kind === "image" && a?.thumbnailUrl);
  const img = imgWithThumb || assets.find(a => a?.kind === "image");
  return img?.thumbnailUrl || img?.url || "";
};

const paginate = (req) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

/* ----------------------- YOUR EXISTING ENDPOINTS (kept) -------------------- */
export async function listCoaches(req, res) {
  try {
    const { specialization } = req.query || {};
    const where = { role: "coach", isListedCoach: true };

    if (specialization && specialization !== "all") {
      where.specialization = new RegExp(`^${specialization}$`, "i");
    }

    const coaches = await User.find(where)
      .select("_id name email role specialization profilePicture avatar city rating bio tagline certifications programsCount")
      .collation({ locale: "tr", strength: 1 })
      .sort({ name: 1 })
      .lean();

    return res.json(coaches);
  } catch (err) {
    console.error("listCoaches error:", err);
    return res.status(500).json({ message: "Server error listing coaches." });
  }
}

export async function getCoach(req, res) {
  try {
    const { id } = req.params;
    const coach = await User.findOne({ _id: id, role: "coach" })
      .select("_id name email role specialization profilePicture")
      .lean();

    if (!coach) return res.status(404).json({ message: "Coach not found" });
    return res.json(coach);
  } catch (err) {
    console.error("getCoach error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* -------------------------- NEW: Profile (flat) ---------------------------- */
/** GET /coaches/:id  -> flat profile for CoachProfileClient */
export async function getCoachProfile(req, res) {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });

    const doc = await User.findOne({ _id: id, role: "coach" })
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
      languages: Array.isArray(doc.languages) ? doc.languages : [],
    };

    return res.json(coach);
  } catch (err) {
    console.error("getCoachProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ----------------------- NEW: Programs (card fields) ----------------------- */
/** GET /coaches/:id/programs?limit=&cursor=&status=Aktif  -> { items, nextCursor } */
export async function getCoachPrograms(req, res) {
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
      .select("name description duration difficulty fitnessGoal assets priceCents currency createdAt status")
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      durationWeeks: p.duration,
      difficulty: p.difficulty,
      goal: p.fitnessGoal,
      priceCents: p.priceCents ?? null,
      currency: p.currency ?? "TRY",
      image: pickCoverImage(p.assets),
    }));

    return res.json({
      items,
      nextCursor: docs.length === limit ? String(docs[docs.length - 1]._id) : null,
    });
  } catch (err) {
    console.error("getCoachPrograms error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* --------------------------- NEW: Reviews (list) --------------------------- */
/** GET /coaches/:id/reviews?limit=&cursor=  -> { items, nextCursor } */
export async function getCoachReviews(req, res) {
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

    return res.json({
      items,
      nextCursor: revs.length === limit ? String(revs[revs.length - 1]._id) : null,
    });
  } catch (err) {
    console.error("getCoachReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ------------------------ NEW: Follow / Unfollow / Get --------------------- */
/** PUT /coaches/:id/follow -> 204 */
export async function followCoach(req, res) {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    await Follow.updateOne(
      { userId: req.user.id, coachId: id },
      { $setOnInsert: { userId: req.user.id, coachId: id, createdAt: new Date() } },
      { upsert: true }
    );
    return res.sendStatus(204);
  } catch (err) {
    // duplicate key = already following; still 204
    if (err?.code === 11000) return res.sendStatus(204);
    console.error("followCoach error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** DELETE /coaches/:id/follow -> 204 */
export async function unfollowCoach(req, res) {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    await Follow.deleteOne({ userId: req.user.id, coachId: id });
    return res.sendStatus(204);
  } catch (err) {
    console.error("unfollowCoach error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /coaches/:id/follow -> { isFollowing } */
export async function getFollowStatus(req, res) {
  try {
    const { id } = req.params;
    if (!isObjId(id)) return res.status(400).json({ message: "Invalid coach id" });
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const exists = await Follow.exists({ userId: req.user.id, coachId: id });
    return res.json({ isFollowing: !!exists });
  } catch (err) {
    console.error("getFollowStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
