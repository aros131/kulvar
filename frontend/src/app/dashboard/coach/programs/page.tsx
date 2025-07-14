import Link from "next/link";
import ProgramsList from "@/components/program/ProgramsList";

export default async function Page() {
  const res = await fetch("https://kulvar-qb7t.onrender.com/programs", {
    cache: "no-store",
  });
  const programs = await res.json();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Programlarım</h1>
        <Link href="/dashboard/coach/programs/create">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            + Yeni Program
          </button>
        </Link>
      </div>

      <ProgramsList programs={programs} />
    </div>
  );
}
