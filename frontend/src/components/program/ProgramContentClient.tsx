"use client";

import { useEffect, useState } from "react";
import ProgramHeader from "@/components/program/ProgramHeader";
import ProgressChart from "@/components/program/ProgressChart";
import SessionList from "@/components/program/SessionList";
import RestartButton from "@/components/program/RestartButton";
import ProgramMedia from "@/components/program/ProgramMedia";
import { Program } from "@/types/program";
export default function ProgramContentClient({ programId }: { programId: string }) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchProgram = async () => {
      try {
        const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Program fetch failed");

        const data = await res.json();
        setProgram(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [programId]);

  if (loading) return <p>Yükleniyor...</p>;
  if (!program) return <p>Program bulunamadı.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProgramHeader
        name={program.name}
        description={program.description}
        coachName={program.coachName || "Koç Bilgisi"}
        completionPercentage={program.completionPercentage || 0}
      />

      <ProgressChart completionPercentage={program.completionPercentage || 0} />

      <SessionList
        dailySchedule={program.dailySchedule}
        onMarkCompleted={(dayIndex, sessionIndex) =>
          console.log("Completed:", dayIndex, sessionIndex)
        }
        onSubmitFeedback={(dayIndex, sessionIndex) =>
          console.log("Feedback:", dayIndex, sessionIndex)
        }
      />

      <RestartButton onRestart={() => console.log("Program restarted")} />

      <ProgramMedia videos={program.videos} pdfs={program.pdfs} />
    </div>
  );
}
