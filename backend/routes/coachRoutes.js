import { Router } from "express";
import User from "../models/User.js";

const router = Router();

const toArray = (x) => Array.isArray(x) ? x : (typeof x === "string" ? x.split(",").map(s=>s.trim()).filter(Boolean) : []);

router.get("/", async (req, res) => {
  try {
    const role = (req.query.role || "").toString().trim();
    const q = (req.query.search || req.query.q || req.query.name || "").toString().trim();
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const filters = {};
    if (role) filters.role = role;
    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { specialization: { $regex: q, $options: "i" } },
        { specialization: { $elemMatch: { $regex: q, $options: "i" } } }
      ];
    }

    const [docs, total] = await Promise.all([
      User.find(filters)
        .select("name profilePicture avatar specialization city rating bio programsCount role")
        .sort({ role: 1, rating: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters)
    ]);

    const users = docs.map(d => ({ ...d, specialization: toArray(d.specialization) }));
    res.json({ users, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
