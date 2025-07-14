import { cookies } from "next/headers";
import { Program } from "@/types/program";
import EditProgramForm from "@/components/coach/EditProgramForm";

interface PageProps {
  params: Promise<{
    programId: string;
  }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { programId } = await params; // ✅ await params and destructure
  
  const cookieStore = await cookies(); // ✅ await is required
  const token = cookieStore.get("token")?.value;

  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return <div className="text-red-600 p-4">Program bulunamadı veya yüklenemedi.</div>;
  }

  const data = await res.json();
  const program: Program = data.program;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Program Detayları</h1>
      <EditProgramForm program={program} mode="edit" />
    </div>
  );
}