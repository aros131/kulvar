// app/dashboard/coach/programs/[programId]/edit/page.tsx
import { cookies } from "next/headers";
import EditProgramForm from "@/components/coach/EditProgramForm";
import ProgramMediaSection from "@/components/coach/ProgramMediaSection";
import { Program } from "@/types/program";

interface Props {
  params: { programId: string };
}

export default async function EditProgramPage({ params }: Props) {
  const { programId } = params;

  // ✅ In your setup cookies() returns a Promise → await it
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://kulvar-qb7t.onrender.com";

  const res = await fetch(`${API_BASE}/programs/${programId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="p-4 text-red-600">
        Program verileri alınamadı ({res.status})!
      </div>
    );
  }

  const data = await res.json();
  const program: Program = data.program ?? data;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <EditProgramForm program={program} mode="edit" />

      {/* Media manager */}
      <div className="mt-10">
        <ProgramMediaSection programId={programId} />
      </div>
    </div>
  );
}
