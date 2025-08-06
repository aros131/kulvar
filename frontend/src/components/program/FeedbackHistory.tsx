// components/program/FeedbackHistory.tsx

import { useEffect, useState } from "react";
import { MessageCircle, CalendarDays, Star } from "lucide-react";

interface Feedback {
  day: number;
  title: string;
  date: string;
  message: string;
  rating?: number; // optional star rating
}

interface FeedbackHistoryProps {
  programId: string;
}

export default function FeedbackHistory({ programId }: FeedbackHistoryProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchFeedback = async () => {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/feedback/program/${programId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setFeedbackList(data.feedback || []);
    };

    fetchFeedback();
  }, [programId]);

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">💬 Geri Bildirimler</h2>
      {feedbackList.length === 0 ? (
        <p className="text-muted-foreground">Henüz geri bildirim yok.</p>
      ) : (
        <ul className="space-y-4">
          {feedbackList.map((f, i) => (
            <li
              key={i}
              className="border-b border-zinc-200 dark:border-zinc-700 pb-2"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  Gün {f.day} – {f.title} ({new Date(f.date).toLocaleDateString("tr-TR")})
                </span>
              </div>
              <div className="flex items-start gap-2 text-zinc-800 dark:text-zinc-100">
                <MessageCircle className="w-4 h-4 mt-[2px]" />
                <span>{f.message}</span>
              </div>
              {f.rating && (
                <div className="flex gap-[2px] mt-1">
                  {Array.from({ length: f.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
