import { cookies } from "next/headers";
import EditProgramForm from "@/components/coach/EditProgramForm";
import { Program } from "@/types/program";

interface PageProps {
  params: { programId: string };
}

export default async function ProgramEditPage({ params }: PageProps) {
  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${params.programId}`, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_USER_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return <div>Program bulunamadı veya yüklenemedi.</div>;
  }

  const program: Program = await res.json();

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <EditProgramForm program={program} mode="edit" />
    </div>
  );
}
