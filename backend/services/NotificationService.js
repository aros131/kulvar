// ESM module
// Minimal stub that logs notifications.
// Replace with your real implementation (push/email/in-app) later.

export async function notify({ toUserId, type, title, message, data = {} }) {
  // no-op implementation for now
  console.log("[notify]", {
    toUserId,
    type,
    title,
    message,
    data,
    at: new Date().toISOString(),
  });
  // return something if callers await a result
  return { ok: true };
}
