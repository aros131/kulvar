import Link from "next/link";

interface Program {
  _id: string;
  name: string;
  description: string;
}

interface ProgramsListProps {
  programs?: Program[];
}

export default function ProgramsList({ programs = [] }: ProgramsListProps) {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Programlar</h1>

      {programs.length === 0 ? (
        <p className="text-gray-500">Henüz program yok.</p>
      ) : (
        programs.map((program) => (
          <div
            key={program._id}
            className="bg-white dark:bg-gray-900 shadow rounded-lg p-4 mb-4"
          >
            <Link href={`/programs/${program._id}`} className="text-blue-500 underline">
              {program.name}
            </Link>

            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {program.description}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
