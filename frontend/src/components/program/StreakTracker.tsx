// components/program/StreakTracker.tsx

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

interface StreakTrackerProps {
  programId: string;
}

export default function StreakTracker({ programId }: StreakTrackerProps) {
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchStreak = async () => {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/progress/streak/${programId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setStreak(data.streak || 0);
    };

    fetchStreak();
  }, [programId]);

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow text-center">
      <div className="flex justify-center mb-2">
        <Flame className="text-orange-500 w-6 h-6 animate-pulse" />
      </div>
      <h2 className="text-lg font-semibold">🔥 {streak} Günlük Streak</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Devam et! Hedefe çok az kaldı.
      </p>
    </div>
  );
}
