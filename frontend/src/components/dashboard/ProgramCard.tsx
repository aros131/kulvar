"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgramCardProps {
  name: string;
  description: string;
  duration: string;
  progressPercentage: number;
}

export default function ProgramCard({
  name,
  description,
  duration,
  progressPercentage,
}: ProgramCardProps) {
  const data = {
    labels: ["Tamamlanan", "Kalan"],
    datasets: [
      {
        data: [progressPercentage, 100 - progressPercentage],
        backgroundColor: ["#22c55e", "#e5e7eb"], // green and gray
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: "70%", // thinner donut ring
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow text-center">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{description}</p>

      {/* ✅ Donut Progress Chart */}
      <div className="w-40 mx-auto mb-4">
        <Doughnut data={data} options={options} />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">Süre: {duration}</p>
      <p className="text-xs mt-1">{progressPercentage}% tamamlandı</p>
    </div>
  );
}
