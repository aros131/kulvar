import { useState } from "react";
import { completeSession } from "@/utils/completeSession";

function CompleteButton({ programId, sessionId, sessionName, onDone }: {
  programId: string;
  sessionId?: string;
  sessionName?: string;
  onDone?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setPending(true);
      setErr(null);
      const res = await completeSession(programId, sessionId, sessionName);
      // optionally toast: res.message
      onDone?.(); // e.g., refetch progress or invalidate SWR/React Query cache
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <button
        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Kaydediliyor…" : "Tamamla"}
      </button>
      {err && <div className="text-sm text-red-600 mt-1">{err}</div>}
    </div>
  );
}
