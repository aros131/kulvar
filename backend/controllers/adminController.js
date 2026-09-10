import Review from '../models/Review.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

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

export const listCoachApplications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor;
    const status = req.query.status === "approved" ? true : req.query.status === "pending" ? false : undefined;

    const q = { role: "coach" };
    if (status !== undefined) q.isApproved = status;
    if (cursor) q._id = { $lt: cursor };

    const coaches = await User.find(q)
      .select("name email city specialization isApproved createdAt")
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      coaches,
      nextCursor: coaches.length === limit ? String(coaches[coaches.length - 1]._id) : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving coach applications", error: error.message });
  }
};

export const setCoachApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved must be a boolean" });
    }

    const coach = await User.findOneAndUpdate(
      { _id: id, role: "coach" },
      { $set: { isApproved: approved } },
      { new: true }
    ).select("name email isApproved");

    if (!coach) return res.status(404).json({ message: "Coach not found" });

    res.status(200).json({ coach });
  } catch (error) {
    res.status(500).json({ message: "Error updating coach approval", error: error.message });
  }
};

export const listPayments = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor;
    const status = req.query.status;

    const q = {};
    if (status) q.status = status;
    if (cursor) q._id = { $lt: cursor };

    const payments = await Payment.find(q)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("coachId", "name email")
      .populate("userId", "name email")
      .lean();

    res.status(200).json({
      payments,
      nextCursor: payments.length === limit ? String(payments[payments.length - 1]._id) : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving payments", error: error.message });
  }
};
