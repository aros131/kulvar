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

    // ✅ Read from chart.data (NOT chart.config.data)
    const dataAny = chart.data as any;
    const meta = (dataAny && dataAny.meta) || {};

    // Fallback: if meta.pct missing, compute from dataset (first slice already holds %)
    let pct: number =
      typeof meta.pct === "number"
        ? meta.pct
        : (() => {
            const ds = Array.isArray(chart.data?.datasets)
              ? (chart.data.datasets[0]?.data as number[] | undefined)
              : undefined;
            const v0 = Array.isArray(ds) ? Number(ds[0]) : NaN;
            return Number.isFinite(v0) ? Math.round(v0) : 0;
          })();

    const sub: string = typeof meta.sub === "string" ? meta.sub : "";

    const { width, height, left, top } = chartArea;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // pick a readable color
    const fgVar = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
    const fg = fgVar || "#111";

    // % value
    ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system";
    ctx.fillStyle = fg;
    ctx.fillText(`${pct}%`, left + width / 2, top + height / 2 - 8);

    // sub label
    if (sub) {
      ctx.font = "400 12px ui-sans-serif, system-ui, -apple-system";
      ctx.globalAlpha = 0.7;
      ctx.fillText(sub, left + width / 2, top + height / 2 + 16);
    }
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
      "completionPercentage" in props && typeof (props as any).completionPercentage === "number";

    const raw = usingPct
      ? (props as any).completionPercentage
      : ((props as any).completedSessions / Math.max(1, (props as any).totalSessions)) * 100;

    const pct = Math.min(100, Math.max(0, Math.round(Number(raw) || 0)));
    const sub =
      "completedSessions" in props && "totalSessions" in props
        ? `${(props as any).completedSessions}/${(props as any).totalSessions} seans`
        : "Program İlerleme";

    return {
      pct,
      subLabel: sub,
      completed: (props as any).completedSessions,
      total: (props as any).totalSessions,
    };
  }, [
    ("completionPercentage" in props ? (props as any).completionPercentage : undefined),
    ("completedSessions" in props ? (props as any).completedSessions : undefined),
    ("totalSessions" in props ? (props as any).totalSessions : undefined),
  ]);

  // Attach our meta to chart.data, so the plugin can read it reliably
  const data: any = {
    labels: ["Tamamlanan", "Kalan"],
    datasets: [
      {
        // first slice is the percent value itself
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
            const meta: any = (ctx.chart.data as any)?.meta || {};
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
    <div className="bg-card dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
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
