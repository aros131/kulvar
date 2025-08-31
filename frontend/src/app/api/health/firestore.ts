// src/pages/api/health/firestore.ts
import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ref = adminDb.collection("health").doc("ping");
    await ref.set({ at: new Date() }, { merge: true });
    const snap = await ref.get();
    res.status(200).json({ ok: true, data: snap.data() });
  } catch (error: unknown) {
    // Type assertion: we assert that error is of type Error
    if (error instanceof Error) {
      console.error(error.message);
      res.status(500).json({ ok: false, error: error.message });
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ ok: false, error: 'Unknown error occurred' });
    }
  }
}
