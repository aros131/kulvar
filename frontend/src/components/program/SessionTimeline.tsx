"use client";

import { useEffect, useState } from "react";
import { completeSession } from "@/utils/completeSession";

type TimelineSession = {
  day: number;
  title: string;
  completed: boolean;
  sessionId?: string;
};

export default function SessionTimeline({
  sessions,
  programId,
  onCompleted, // optional: let parent refetch/propgate
}: {
  sessions: TimelineSession[];
  programId: string;
  onCompleted?: (sessionId?: string) => void;
}) {
  // keep a local copy so we can flip "completed" without reloading the page
  const [rows, setRows] = useState<TimelineSession[]>(sessions);
  useEffect(() => setRows(sessions), [sessions]);

  const markLocalCompleted = (sid?: string) => {
    setRows((prev) =>
      prev.map((r) =>
        (sid && r.sessionId === sid) || (!sid && r.title)
          ? { ...r, completed: sid ? r.sessionId === sid || r.completed : r.completed }
          : r
      )
    );
  };

  return (
    <ul className="space-y-2">
      {rows.map((s, i) => (
        <li
          key={s.sessionId ?? `${s.day}-${i}`}
          className="flex items-center justify-between rounded-lg bg-card dark:bg-zinc-900 p-3"
        >
          <div>
            <div className="font-medium">Gün {s.day}: {s.title}</div>
            <div className="text-xs text-muted-foreground">
              {s.completed ? "Tamamlandı" : "Bekliyor"}
            </div>
          </div>

          {!s.completed && (
            <RowCompleteButton
              programId={programId}
              sessionId={s.sessionId}
              sessionName={s.title}
              onOk={() => {
                markLocalCompleted(s.sessionId);
                onCompleted?.(s.sessionId);
              }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function RowCompleteButton({
  programId,
  sessionId,
  sessionName,
  onOk,
}: {
  programId: string;
  sessionId?: string;
  sessionName?: string;
  onOk?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    if (!programId || (!sessionId && !sessionName)) {
      setErr("programId ve (sessionId | sessionName) gerekli");
      return;
    }
    try {
      setPending(true);
      setErr(null);
      await completeSession(programId, sessionId, sessionName);
      onOk?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        aria-label="Seansı tamamla"
      >
        {pending ? "Kaydediliyor…" : "Tamamla"}
      </button>
      {err && <div className="text-sm text-red-600 mt-1" role="alert">{err}</div>}
    </div>
  );
}
