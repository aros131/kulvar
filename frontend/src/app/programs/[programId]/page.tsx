import ProgramContentClient from "@/components/program/ProgramContentClient";


interface PageProps {
  params: { programId: string };
}

export default function Page({ params }: PageProps) {
  const { programId } = params; // ✅ params is plain object
  return <ProgramContentClient programId={programId} />;
}


