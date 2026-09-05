import Notification from '../models/Notification.js';

/**
 * Internal helper to create a notification without going through HTTP.
 * @param {{ recipientId, senderId?, type, message }} opts
 */
export async function notify({ recipientId, senderId, type, message }) {
  try {
    await Notification.create({ recipientId, senderId, type, message });
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}
