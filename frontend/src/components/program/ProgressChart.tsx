"use client";

import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Plugin,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Props =
  | { completionPercentage: number; completedSessions?: never; totalSessions?: never }
  | { completionPercentage?: never; completedSessions: number; totalSessions: number };

const centerText: Plugin<"doughnut"> = {
  id: "centerText",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { width, height, left, top } = chartArea;

    // we pass our own meta via data.meta
    const meta: any = (chart.config.data as any)?.meta || {};
    const pct = meta?.pct ?? 0;
    const sub = meta?.sub ?? "";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // % value
    ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system";
    // try CSS var, fallback to dark/light safe color
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--foreground") || "#111";
    ctx.fillStyle = fg.trim() || "#111";
    ctx.fillText(`${pct}%`, left + width / 2, top + height / 2 - 8);

    // sub label (e.g., 8/12 seans)
    ctx.font = "400 12px ui-sans-serif, system-ui, -apple-system";
    ctx.globalAlpha = 0.7;
    ctx.fillText(sub, left + width / 2, top + height / 2 + 16);
    ctx.restore();
  },
};

function colorFor(pct: number) {
  if (pct >= 80) return "#22c55e"; // green
  if (pct >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

const ProgressChart: React.FC<Props> = (props) => {
  const { pct, subLabel, completed, total } = useMemo(() => {
    const usingPct =
      "completionPercentage" in props && typeof props.completionPercentage === "number";

    const raw = usingPct
      ? props.completionPercentage
      : (props.completedSessions / Math.max(1, props.totalSessions)) * 100;

    const pct = Math.min(100, Math.max(0, Math.round(raw || 0)));
    const sub =
      "completedSessions" in props && "totalSessions" in props
        ? `${props.completedSessions}/${props.totalSessions} seans`
        : "Program İlerleme";

    return {
      pct,
      subLabel: sub,
      completed: "completedSessions" in props ? props.completedSessions : undefined,
      total: "totalSessions" in props ? props.totalSessions : undefined,
    };
  }, [("completionPercentage" in props ? props.completionPercentage : undefined), ("completedSessions" in props ? props.completedSessions : undefined), ("totalSessions" in props ? props.totalSessions : undefined)]);

  // Use `any` here to attach our custom meta for the centerText plugin & tooltip
  const data: any = {
    labels: ["Tamamlanan", "Kalan"],
    datasets: [
      {
        data: [pct, 100 - pct],
        backgroundColor: [colorFor(pct), "#e5e7eb"],
        borderWidth: 0,
      },
    ],
    meta: { pct, sub: subLabel, completed, total },
  };

  const options: ChartOptions<"doughnut"> = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const meta: any = (ctx.chart.config.data as any)?.meta || {};
            const slicePct = Math.round(Number(ctx.parsed) || 0);
            if (ctx.dataIndex === 0 && meta.completed != null && meta.total != null) {
              return `${ctx.label}: ${slicePct}% (${meta.completed}/${meta.total})`;
            }
            return `${ctx.label}: ${slicePct}%`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
      <h2 className="text-lg font-semibold mb-4">Program İlerleme</h2>
      <div
        className="mx-auto aspect-square max-w-[280px] w-full"
        role="img"
        aria-label={`Program ilerleme grafiği: ${pct} yüzde tamamlandı (${subLabel}).`}
      >
        <Doughnut data={data} options={options} plugins={[centerText]} />
      </div>
    </div>
  );
};

export default ProgressChart;
