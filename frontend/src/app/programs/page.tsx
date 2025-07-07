import ProgramsList from "@/components/program/ProgramsList";

export default async function Page() {
  const res = await fetch("https://kulvar-qb7t.onrender.com/programs", {
    cache: "no-store",
  });
  const programs = await res.json();

  return <ProgramsList programs={programs} />;
}
 