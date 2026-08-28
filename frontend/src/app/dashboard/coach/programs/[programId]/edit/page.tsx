"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EditProgramForm from "@/components/coach/EditProgramForm";
import ProgramMediaSection from "@/components/coach/ProgramMediaSection";
import { Program } from "@/types/program";
import CoachPageShell from "@/components/coach/CoachPageShell";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function EditProgramPage() {
  const params = useParams<{ programId: string }>();
  const programId = Array.isArray(params.programId)
    ? params.programId[0]
    : params.programId;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErr("Giriş gerekli (token bulunamadı).");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          setErr(`Program verileri alınamadı (${res.status}) ${text || ""}`);
          return;
        }

        const data = await res.json();
        setProgram(data.program ?? data);
     } catch (e: unknown) {
  const msg =
    e instanceof Error ? e.message :
    typeof e === "string" ? e :
    "İstek hatası";
  setErr(msg);
} finally {
  setLoading(false);
}

    })();
  }, [programId]);

  if (loading) return <div className="p-4">Yükleniyor…</div>;
  if (err) return <CoachPageShell><div className="p-4 text-red-600">{err}</div></CoachPageShell>;
  if (!program) return <CoachPageShell><div className="p-4 text-red-600">Program bulunamadı.</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <EditProgramForm program={program} mode="edit" />
      <div className="mt-10">
        <ProgramMediaSection programId={programId} />
      </div>
    </div>
    </CoachPageShell>
  );
}
