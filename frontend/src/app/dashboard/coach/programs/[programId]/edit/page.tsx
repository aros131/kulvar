"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EditProgramForm from "@/components/coach/EditProgramForm";
import ProgramMediaSection from "@/components/coach/ProgramMediaSection";
import { Program } from "@/types/program";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://kulvar-qb7t.onrender.com";

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
          typeof e === "object" && e && "message" in e
            ? (e as any).message
            : "İstek hatası";
        setErr(String(msg));
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  if (loading) return <div className="p-4">Yükleniyor…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!program) return <div className="p-4 text-red-600">Program bulunamadı.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <EditProgramForm program={program} mode="edit" />
      <div className="mt-10">
        <ProgramMediaSection programId={programId} />
      </div>
    </div>
  );
}
