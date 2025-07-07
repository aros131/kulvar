import ProgramContentClient from "@/components/program/ProgramContentClient";

interface PageProps {
  params: { programId: string };
}

export default function Page({ params }: PageProps) {
  return <ProgramContentClient programId={params.programId} />;
}
