// components/program/ProgressChart.tsx

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgressChartProps {
  completionPercentage: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ completionPercentage }) => {
  const data = {
    labels: ["Tamamlanan", "Kalan"],
    datasets: [
      {
        data: [completionPercentage, 100 - completionPercentage],
        backgroundColor: ["#4ade80", "#e5e7eb"], // green, gray
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2">Program İlerleme</h2>
      <Doughnut data={data} width={100} height={100} />

    </div>
  );
};

export default ProgressChart;
