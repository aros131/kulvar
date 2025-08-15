// components/program/SessionTimeline.tsx
"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";
import CompleteSessionDialog from "./CompleteSessionDialog";

interface Session {
  day: number;
  title: string;
  completed?: boolean;
  missed?: boolean;
}

interface SessionTimelineProps {
  sessions: Session[];
  programId: string;
}

export default function SessionTimeline({ sessions, programId }: SessionTimelineProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📅 Günlük Seans Takvimi</h2>
      <ul className="space-y-4">
        {sessions.map((session) => {
          let statusIcon;
          let statusColor = "";

          if (session.completed) {
            statusIcon = <CheckCircle className="text-green-500 w-5 h-5" />;
            statusColor = "text-green-600";
          } else if (session.missed) {
            statusIcon = <XCircle className="text-red-500 w-5 h-5" />;
            statusColor = "text-red-600";
          } else {
            statusIcon = <Clock className="text-yellow-500 w-5 h-5" />;
            statusColor = "text-yellow-600";
          }

          return (
            <li
              key={session.day}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-200 pb-2"
            >
              <div className="flex items-center gap-3">
                {statusIcon}
                <span className={`text-sm font-medium ${statusColor}`}>
                  Gün {session.day}: {session.title}
                </span>
              </div>
              <CompleteSessionDialog
  programId={programId}
  day={session.day}
  sessionTitle={session.title}
/>

            </li>
          );
        })}
      </ul>
    </div>
  );
}
// utils/completeSession.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

function token() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t ? t.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "") : null;
}

export async function completeSession(programId: string, sessionId?: string, sessionName?: string) {
  const t = token();
  if (!t) throw new Error("Giriş yapın: token yok");

  const res = await fetch(`${API}/progress/complete-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${t}`,
    },
    body: JSON.stringify({ programId, sessionId, sessionName }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Tamamlama hatası ${res.status}: ${txt}`);
  }
  return res.json();
}
