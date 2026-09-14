// services/engagementBillingJob.js
import { DateTime } from "luxon";
import CoachingEngagement from "../models/CoachingEngagement.js";
import Payment from "../models/Payment.js";
import { notify } from "../utils/notify.js";

const INTERVAL_MS = 60 * 60 * 1000; // run hourly

function advance(billingType, from) {
  const dt = DateTime.fromJSDate(from);
  return billingType === "monthly" ? dt.plus({ months: 1 }).toJSDate() : dt.plus({ weeks: 1 }).toJSDate();
}

async function runOnce() {
  const now = new Date();

  const due = await CoachingEngagement.find({
    status: "active",
    billingType: { $in: ["monthly", "weekly"] },
    nextBillingDate: { $lte: now },
  });

  if (due.length === 0) return;

  for (const engagement of due) {
    try {
      // Advance the clock first so a slow notify/create step (or an overlapping
      // run) can't double-bill this engagement for the same period.
      const periodStart = engagement.nextBillingDate;
      engagement.nextBillingDate = advance(engagement.billingType, periodStart);
      await engagement.save();

      const label = engagement.billingType === "monthly" ? "Aylık" : "Haftalık";
      const dateStr = DateTime.fromJSDate(periodStart).setLocale("tr").toFormat("dd MMMM yyyy");
      const description = `${label} çalışma ücreti - ${dateStr}`;

      const payment = await Payment.create({
        coachId: engagement.coachId,
        userId: engagement.userId,
        engagementId: engagement._id,
        amount: engagement.rate,
        description,
        status: "Pending",
      });

      await notify({
        recipientId: engagement.userId,
        senderId: engagement.coachId,
        type: "payment_request",
        message: `Koçundan ₺${payment.amount} tutarında yeni bir ödeme talebi geldi: "${payment.description}"`,
      });
    } catch (err) {
      console.error("[engagement-billing] failed for engagement", engagement._id, err.message);
    }
  }
}

export function startEngagementBillingJob() {
  runOnce().catch((err) => console.error("[engagement-billing] initial run failed:", err.message));
  setInterval(() => {
    runOnce().catch((err) => console.error("[engagement-billing] run failed:", err.message));
  }, INTERVAL_MS);
}
