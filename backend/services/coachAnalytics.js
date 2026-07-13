import Program from "../models/Program.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import Progress from "../models/Progress.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

/** Aggregates the metrics coaches see on the analytics page and in generated reports. */
export async function computeCoachAnalytics(coachId) {
  const programs = await Program.find({ coachId }).select("_id assignedClients").lean();
  const totalPrograms = programs.length;
  const programIds = programs.map((p) => p._id);

  const clientSet = new Set();
  programs.forEach((p) => (p.assignedClients || []).forEach((id) => clientSet.add(String(id))));
  const totalClients = clientSet.size;

  const [paidAgg, pendingAgg, completedSessions, upcomingSessions, progressAgg, reviewCount, coachUser] =
    await Promise.all([
      Payment.aggregate([
        { $match: { coachId, status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { coachId, status: "Pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.countDocuments({ coachId, status: "completed" }),
      Booking.countDocuments({ coachId, status: "confirmed" }),
      programIds.length
        ? Progress.aggregate([
            { $match: { programId: { $in: programIds } } },
            { $group: { _id: null, avg: { $avg: "$goalTracking.progressPercentage" } } },
          ])
        : Promise.resolve([]),
      Review.countDocuments({ coachId }),
      User.findById(coachId).select("rating").lean(),
    ]);

  return {
    totalPrograms,
    totalClients,
    totalRevenue: paidAgg[0]?.total || 0,
    pendingRevenue: pendingAgg[0]?.total || 0,
    completedSessions,
    upcomingSessions,
    avgClientProgress: progressAgg[0]?.avg != null ? Math.round(progressAgg[0].avg) : null,
    avgRating: coachUser?.rating || 0,
    reviewCount,
  };
}
