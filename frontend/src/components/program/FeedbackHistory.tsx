// src/components/program/FeedbackHistory.tsx
"use client";
import { useState } from "react";

export default function FeedbackHistory({ programId }: { programId: string }) {
  // There is no GET route to list feedback in your backend right now.
  // So we just show an empty state safely.
  const [items] = useState<Array<{ date: string; session: string; feedback: string }>>([]);

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <h3 className="font-medium mb-2">Geri Bildirim Geçmişi</h3>
      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">Henüz geri bildirim yok.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="text-sm">
              <div className="font-medium">{it.session}</div>
              <div className="text-zinc-500">{new Date(it.date).toLocaleString()}</div>
              <div>{String(it.feedback ?? "")}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
