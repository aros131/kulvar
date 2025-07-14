import ProgramGeneralForm from "@/components/program/edit/ProgramGeneralForm";

export default async function ProgramEditPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params; // ✅ Added await and destructuring
  
  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, { // ✅ Use programId instead of params.programId
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_USER_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return <div>Program bulunamadı.</div>;

  const program = await res.json();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Programı Düzenle</h1>
      <ProgramGeneralForm program={program} />
    </div>
  );
}