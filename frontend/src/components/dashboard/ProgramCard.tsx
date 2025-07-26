"use client";

import ProgressChart from "@/components/program/ProgressChart";

interface ProgramCardProps {
  name: string;
  description: string;
  duration: string;
  progressPercentage: number;
  image?: string;
  goalTag?: string;
  coachName?: string;
}

export default function ProgramCard({
  name,
  description,
  duration,
  progressPercentage,
 
  goalTag,
  coachName,
}: ProgramCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow text-center transition-transform hover:scale-[1.02]">
      {goalTag && (
        <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mb-2">
          {goalTag}
        </span>
      )}

      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{description}</p>

      {/* ✅ Replace Doughnut Chart with ProgressChart */}
      <div className="w-32 sm:w-40 mx-auto mb-4">
        <ProgressChart completionPercentage={progressPercentage} />
      </div>

      {coachName && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Koç: {coachName}</p>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Süre: {duration}</p>
      <p className="text-xs mt-1">{progressPercentage}% tamamlandı</p>
    </div>
  );
}
