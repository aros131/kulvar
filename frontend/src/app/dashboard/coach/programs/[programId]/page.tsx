import ProgramGeneralForm from "@/components/program/edit/ProgramGeneralForm";

export default async function ProgramEditPage({ params }: { params: { programId: string } }) {
  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${params.programId}`, {
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
