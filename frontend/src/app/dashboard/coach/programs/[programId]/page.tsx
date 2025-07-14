import ProgramContentClient from "@/components/program/ProgramContentClient";

interface PageProps {
  params: Promise<{ programId: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { programId } = resolvedParams;

  return <ProgramContentClient programId={programId} />;
}
