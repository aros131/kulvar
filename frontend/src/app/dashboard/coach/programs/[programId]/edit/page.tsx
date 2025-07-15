import { cookies } from "next/headers";
import EditProgramForm from "@/components/coach/EditProgramForm";
import { Program } from "@/types/program";

interface Props {
  params: Promise<{ programId: string }>;
}

export default async function EditProgramPage({ params }: Props) {
  const { programId } = await params; // ✅ DİKKAT: `await` eklendi

  const cookieStore = await cookies(); // ✅ DİKKAT: `await` olmalı
  const token = cookieStore.get("token")?.value;
console.log("Token →", token); // terminal'de göreceksin

  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return <div className="p-4 text-red-600">Program verileri alınamadı (404)!</div>;
  }

  const data = await res.json();
  const program: Program = data.program;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <EditProgramForm program={program} mode="edit" />
    </div>
  );
}