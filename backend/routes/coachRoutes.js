// GET /coaches
router.get("/", async (req, res) => {
  try {
    const q = (req.query.search || req.query.q || req.query.name || "").trim();
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    // ⬅️ ensure ONLY coaches (case-insensitive, covers bad data)
    const roleFilter = { role: { $regex: /^coach$/i } };

    const filters = q
      ? {
          $and: [
            roleFilter,
            {
              $or: [
                { name: { $regex: q, $options: "i" } },
                { city: { $regex: q, $options: "i" } },
                { specialization: { $regex: q, $options: "i" } }, // string
                { specialization: { $elemMatch: { $regex: q, $options: "i" } } }, // array
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

    const toArray = (x) =>
      Array.isArray(x) ? x : typeof x === "string" ? x.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const coaches = docs.map((d) => ({ ...d, specialization: toArray(d.specialization) }));
    res.json({ coaches, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});
