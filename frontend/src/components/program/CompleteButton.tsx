"use client";

import { useState } from "react";
import { completeSession, type CompleteSessionResponse } from "@/utils/completeSession";

type Props = {
  programId: string;
  sessionId?: string;
  sessionName?: string;
  onDone?: (res: CompleteSessionResponse) => void; // e.g. refetch, mutate, toast
  children?: React.ReactNode; // allow custom label
};

export default function CompleteButton({
  programId,
  sessionId,
  sessionName,
  onDone,
  children,
}: Props) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleClick = async () => {
    // runtime guard – keeps you from calling the API wrong
    if (!programId || (!sessionId && !sessionName)) {
      setErr("programId ve (sessionId | sessionName) gerekli");
      return;
    }

    try {
      setPending(true);
      setErr(null);
      setOk(null);

      const res = await completeSession(programId, sessionId, sessionName);
      setOk(res?.message || "Tamamlandı");
      onDone?.(res); // caller can refetch progress or show toast
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Kaydediliyor…" : (children ?? "Tamamla")}
      </button>

      {err && <div className="text-sm text-red-600 mt-1">{err}</div>}
      {ok && !err && <div className="text-sm text-green-700 mt-1">{ok}</div>}
    </div>
  );
}
