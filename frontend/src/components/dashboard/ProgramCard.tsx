// components/dashboard/ProgramCard.tsx

"use client";

import Image from "next/image";

interface ProgramCardProps {
  name: string;
  description: string;
  duration: string;
  image?: string; // Optional program thumbnail
}

export default function ProgramCard({ name, description, duration, image }: ProgramCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-md transition">
      {image && (
        <Image
          src={image}
          alt={name}
          width={400}
          height={200}
          className="rounded-lg object-cover"
        />
      )}
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Süre: {duration}</p>
      <button className="bg-zinc-700 hover:bg-zinc-800 text-white py-1 rounded mt-auto">
        Programı Gör
      </button>
    </div>
  );
}
