// components/dashboard/ProgramCard.tsx
import {  Clock, Dumbbell, Flag } from "lucide-react";
import { cn } from "@/lib/utils"; // optional utility for class merging

interface ProgramCardProps {
  name: string;
  description: string;
  duration: number;
  difficulty: string;
  fitnessGoal: string;
  progressPercentage: number;
  status?: string;
  image?: string;
}

export default function ProgramCard({
  name,
  description,
  duration,
  difficulty,
  fitnessGoal,
  progressPercentage,
  status = "Aktif",
  
}: ProgramCardProps) {
  const chartData = {
    completed: progressPercentage,
    remaining: 100 - progressPercentage,
  };

  return (
    <div className="rounded-xl overflow-hidden shadow bg-white dark:bg-zinc-800 hover:shadow-md transition-all duration-300">
     

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{name}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{description}</p>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            <Clock size={14} /> {duration} hafta
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            <Dumbbell size={14} /> {difficulty}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            <Flag size={14} /> {fitnessGoal}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500 dark:text-zinc-400">İlerleme</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              %{chartData.completed}
            </span>
          </div>
          <div className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${chartData.completed}%` }}
            />
          </div>
        </div>
        {/* Status Badge */}
        <div className="mt-3">
          <span
            className={cn(
              "inline-block px-2 py-1 text-xs rounded-full font-medium",
              status === "Aktif"
                ? "bg-green-100 text-green-700"
                : status === "Tamamlandı"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
