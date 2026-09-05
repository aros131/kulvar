// ESM module
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Maps notification type → notificationPreferences.inApp key
const TYPE_TO_PREF = {
  booking_request:   "bookingRequests",
  booking_approved:  "bookingUpdates",
  booking_declined:  "bookingUpdates",
  booking_cancelled: "bookingUpdates",
  booking_completed: "bookingUpdates",
  message:           "messages",
  review:            "reviews",
};

/**
 * Persists an in-app notification for the recipient, unless the recipient
 * has disabled that category in their notification preferences.
 */
export async function notify({ toUserId, type, title, message, data = {} }) {
  if (!toUserId || !type || !message) {
    console.warn("[notify] missing required fields, skipping", { toUserId, type, message });
    return { ok: false };
  }

  // Check recipient's inApp preference for this notification type
  const prefKey = TYPE_TO_PREF[type];
  if (prefKey) {
    try {
      const recipient = await User.findById(toUserId).select("notificationPreferences").lean();
      const inApp = recipient?.notificationPreferences?.inApp;
      // If the preference is explicitly false, skip creating the notification
      if (inApp && inApp[prefKey] === false) {
        return { ok: false, skipped: true };
      }
    } catch {
      // If preference lookup fails, still deliver the notification
    }
  }

  const text = title ? `${title}: ${message}` : message;

  try {
    const doc = await Notification.create({
      recipientId: toUserId,
      senderId: data?.fromUserId || undefined,
      message: text,
      type,
    });
    return { ok: true, notification: doc };
  } catch (err) {
    console.error("[notify] failed to persist notification:", err.message);
    return { ok: false, error: err.message };
  }
}
