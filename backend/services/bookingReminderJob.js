import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendBookingReminderEmail } from "./emailService.js";

const INTERVAL_MS = 30 * 60 * 1000; // run every 30 minutes

async function runOnce() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    status:       "confirmed",
    reminderSent: false,
    startUtc:     { $gte: windowStart, $lte: windowEnd },
  }).lean();

  if (bookings.length === 0) return;

  for (const booking of bookings) {
    try {
      const [client, coach] = await Promise.all([
        User.findById(booking.userId).select("name email notificationPreferences").lean(),
        User.findById(booking.coachId).select("name").lean(),
      ]);

      if (!client || !client.email) continue;

      // Respect email booking-update preference (default true)
      const emailPrefs = client.notificationPreferences?.email;
      if (emailPrefs && emailPrefs.bookingUpdates === false) {
        // Mark sent so we don't retry
        await Booking.updateOne({ _id: booking._id }, { $set: { reminderSent: true } });
        continue;
      }

      const dateStr = new Date(booking.startUtc).toLocaleDateString("tr-TR", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const timeStr = new Date(booking.startUtc).toLocaleTimeString("tr-TR", {
        hour: "2-digit", minute: "2-digit",
      });

      await sendBookingReminderEmail({
        clientName:  client.name,
        clientEmail: client.email,
        coachName:   coach?.name || "Koçun",
        date:        dateStr,
        time:        timeStr,
      });

      await Booking.updateOne({ _id: booking._id }, { $set: { reminderSent: true } });
    } catch (err) {
      console.error("[reminder] failed for booking", booking._id, err.message);
    }
  }
}

export function startBookingReminderJob() {
  // Run once at startup (catches any missed reminders), then on interval
  runOnce().catch(err => console.error("[reminder] initial run error:", err.message));
  setInterval(() => {
    runOnce().catch(err => console.error("[reminder] interval run error:", err.message));
  }, INTERVAL_MS);
  console.log("⏰ Booking reminder job started (runs every 30 min)");
}
