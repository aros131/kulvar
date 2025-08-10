// components/program/CalendarHeatmap.tsx

import { useEffect, useState } from "react";

interface CalendarHeatmapProps {
  programId: string;
}

interface CalendarEntry {
  date: string; // ISO date string
  status: "completed" | "missed" | "none";
}

export default function CalendarHeatmap({ programId }: CalendarHeatmapProps) {
  const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchCalendar = async () => {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/progress/calendar/${programId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setCalendarData(data.days || []);
    };

    fetchCalendar();
  }, [programId]);

  const getColor = (status: string) => {
    if (status === "completed") return "bg-green-500";
    if (status === "missed") return "bg-red-400";
    return "bg-zinc-300 dark:bg-zinc-700";
  };

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">🗓 Antrenman Takvimi</h2>
      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((entry, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded ${getColor(entry.status)}`}
            title={new Date(entry.date).toLocaleDateString("tr-TR")}
          ></div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-3">Son 30 gün</p>
    </div>
  );
}

