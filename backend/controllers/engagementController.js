// controllers/engagementController.js
import { DateTime } from "luxon";
import CoachingEngagement from "../models/CoachingEngagement.js";
import { notify } from "../utils/notify.js";

function computeNextBillingDate(billingType, from) {
  const start = DateTime.fromJSDate(from ? new Date(from) : new Date());
  if (billingType === "monthly") return start.plus({ months: 1 }).toJSDate();
  if (billingType === "weekly") return start.plus({ weeks: 1 }).toJSDate();
  return null; // per_session isn't billed on a calendar cadence
}

/** POST /engagements — coach starts a recurring/face-to-face billing relationship with a client */
export const createEngagement = async (req, res) => {
  try {
    const coachId = req.user._id;
    const { userId, billingType, rate, startDate, notes } = req.body || {};

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!["monthly", "weekly", "per_session"].includes(billingType)) {
      return res.status(400).json({ message: "billingType invalid" });
    }
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate) || numericRate < 0) {
      return res.status(400).json({ message: "rate must be a non-negative number" });
    }

    const existing = await CoachingEngagement.findOne({ coachId, userId, status: "active" });
    if (existing) {
      return res.status(409).json({ message: "Bu danışan için zaten aktif bir çalışma kaydı var." });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const engagement = await CoachingEngagement.create({
      coachId,
      userId,
      billingType,
      rate: numericRate,
      startDate: start,
      nextBillingDate: computeNextBillingDate(billingType, start),
      notes,
    });

    try {
      await notify({
        recipientId: userId,
        senderId: coachId,
        type: "engagement_started",
        message: `Koçunla yeni bir çalışma planı başladı (${billingType}).`,
      });
    } catch (e) {
      console.warn("notify(engagement_started) failed:", e?.message || e);
    }

    res.status(201).json({ engagement });
  } catch (error) {
    res.status(500).json({ message: "Error creating engagement", error: error.message });
  }
};

/** GET /engagements — coach lists their own engagements */
export const listForCoach = async (req, res) => {
  try {
    const engagements = await CoachingEngagement.find({ coachId: req.user._id })
      .sort({ status: 1, createdAt: -1 })
      .populate("userId", "name email profilePicture");
    res.status(200).json({ engagements });
  } catch (error) {
    res.status(500).json({ message: "Error listing engagements", error: error.message });
  }
};

/** GET /engagements/mine — user lists their own engagements */
export const listForUser = async (req, res) => {
  try {
    const engagements = await CoachingEngagement.find({ userId: req.user._id })
      .sort({ status: 1, createdAt: -1 })
      .populate("coachId", "name email profilePicture");
    res.status(200).json({ engagements });
  } catch (error) {
    res.status(500).json({ message: "Error listing engagements", error: error.message });
  }
};

/** PATCH /engagements/:id — coach updates rate/billingType/status/notes */
export const updateEngagement = async (req, res) => {
  try {
    const coachId = req.user._id;
    const { id } = req.params;
    const { billingType, rate, status, notes } = req.body || {};

    const engagement = await CoachingEngagement.findOne({ _id: id, coachId });
    if (!engagement) return res.status(404).json({ message: "Engagement not found" });

    if (billingType && !["monthly", "weekly", "per_session"].includes(billingType)) {
      return res.status(400).json({ message: "billingType invalid" });
    }
    if (rate !== undefined) {
      const numericRate = Number(rate);
      if (!Number.isFinite(numericRate) || numericRate < 0) {
        return res.status(400).json({ message: "rate must be a non-negative number" });
      }
      engagement.rate = numericRate;
    }
    if (status && !["active", "paused", "ended"].includes(status)) {
      return res.status(400).json({ message: "status invalid" });
    }
    if (notes !== undefined) engagement.notes = notes;

    const resumingFromInactive = status === "active" && engagement.status !== "active";
    const billingTypeChanged = billingType && billingType !== engagement.billingType;

    if (billingType) engagement.billingType = billingType;
    if (status) engagement.status = status;

    // Recompute the billing clock when (a) switching cadence, or (b) resuming a
    // paused/ended engagement — otherwise a stale past nextBillingDate would
    // trigger an immediate catch-up charge the moment it goes active again.
    if (billingTypeChanged || resumingFromInactive) {
      engagement.nextBillingDate = computeNextBillingDate(engagement.billingType, new Date());
    }

    await engagement.save();
    res.status(200).json({ engagement });
  } catch (error) {
    res.status(500).json({ message: "Error updating engagement", error: error.message });
  }
};
