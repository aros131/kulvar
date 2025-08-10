// src/app/api/health/firestore/route.ts
export const runtime = "nodejs";

import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  // Change _health to health
  const ref = adminDb.collection("health").doc("ping");
  await ref.set({ at: new Date() }, { merge: true });
  const snap = await ref.get();
  return new Response(JSON.stringify({ ok: true, data: snap.data() }), {
    headers: { "content-type": "application/json" },
  });
}
