"use client";

import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type Plugin,
  type ChartOptions,
  type TooltipItem,
  type ChartData,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Props =
  | { completionPercentage: number; completedSessions?: never; totalSessions?: never }
  | { completionPercentage?: never; completedSessions: number; totalSessions: number };

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function colorFor(pct: number) {
  if (pct >= 80) return "#22c55e"; // green
  if (pct >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export default function ProgressChart(props: Props) {
  // --- derive values from props (no any, no complex deps) ---
  const usingPct =
    "completionPercentage" in props && typeof props.completionPercentage === "number";

  const rawPct = usingPct
    ? props.completionPercentage
    : (props.completedSessions / Math.max(1, props.totalSessions)) * 100;

  const pct = clampPercent(rawPct || 0);
  const completed = usingPct ? undefined : props.completedSessions;
  const total = usingPct ? undefined : props.totalSessions;
  const subLabel =
    completed != null && total != null ? `${completed}/${total} seans` : "Program İlerleme";

  // --- center text plugin (close over pct + subLabel to avoid 'any') ---
  const centerText = useMemo<Plugin<"doughnut">>(() => {
    return {
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const { width, height, left, top } = chartArea;

        // Safe foreground color from CSS var (fallback provided)
        let fg = "#111";
        if (typeof window !== "undefined") {
          const css = getComputedStyle(document.documentElement);
          const v = css.getPropertyValue("--foreground").trim();
          if (v) fg = v;
        }

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // % value
        ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system";
        ctx.fillStyle = fg;
        ctx.fillText(`${pct}%`, left + width / 2, top + height / 2 - 8);

        // sub label
        ctx.font = "400 12px ui-sans-serif, system-ui, -apple-system";
        ctx.globalAlpha = 0.7;
        ctx.fillText(subLabel, left + width / 2, top + height / 2 + 16);
        ctx.restore();
      },
    };
  }, [pct, subLabel]);

  // --- data & options (fully typed, no meta hacks) ---
  const data: ChartData<"doughnut", number[], string> = {
    labels: ["Tamamlanan", "Kalan"],
    datasets: [
      {
        data: [pct, 100 - pct],
        backgroundColor: [colorFor(pct), "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"doughnut">) => {
            const slicePct = Math.round(Number(ctx.parsed) || 0);
            if (ctx.dataIndex === 0 && completed != null && total != null) {
              return `${ctx.label}: ${slicePct}% (${completed}/${total})`;
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
        aria-label={`Program ilerleme grafiği: yüzde ${pct} tamamlandı (${subLabel}).`}
      >
        <Doughnut data={data} options={options} plugins={[centerText]} />
      </div>
    </div>
  );
}
