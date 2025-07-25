// components/program/SessionTimeline.tsx
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Session {
  day: number;
  title: string;
  completed?: boolean;
  missed?: boolean;
}

interface SessionTimelineProps {
  sessions: Session[];
}

export default function SessionTimeline({ sessions }: SessionTimelineProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📅 Günlük Seans Takvimi</h2>
      <ul className="space-y-3">
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
              className="flex items-center gap-3 border-b border-zinc-200 pb-2"
            >
              {statusIcon}
              <span className={`text-sm font-medium ${statusColor}`}>
                Gün {session.day}: {session.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
