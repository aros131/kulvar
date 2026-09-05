import Review from '../models/Review.js';
import User from '../models/User.js';

export const listReviews = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor;

    const q = {};
    if (cursor) q._id = { $lt: cursor };

    const reviews = await Review.find(q)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .populate("coachId", "name email")
      .lean();

    res.status(200).json({
      reviews,
      nextCursor: reviews.length === limit ? String(reviews[reviews.length - 1]._id) : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving reviews", error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // recompute the affected coach's average rating
    const agg = await Review.aggregate([
      { $match: { coachId: review.coachId } },
      { $group: { _id: "$coachId", avg: { $avg: "$rating" } } },
    ]);
    await User.updateOne(
      { _id: review.coachId },
      { $set: { rating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0 } }
    );

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error: error.message });
  }
};
