import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotification } from '../services/firebaseAdmin.js';

/**
 * Internal helper to create a notification without going through HTTP.
 * @param {{ recipientId, senderId?, type, message }} opts
 */
export async function notify({ recipientId, senderId, type, message }) {
  try {
    await Notification.create({ recipientId, senderId, type, message });

    const recipient = await User.findById(recipientId).select('fcmToken').lean();
    if (recipient?.fcmToken) {
      sendPushNotification(recipient.fcmToken, { title: 'Kulvar', body: message }).catch(() => {});
    }
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}
