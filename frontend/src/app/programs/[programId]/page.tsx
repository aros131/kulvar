// app/programs/[programId]/page.tsx

import ProgramHeader from "@/components/program/ProgramHeader";
import ProgressChart from "@/components/program/ProgressChart";
import SessionList from "@/components/program/SessionList";
import RestartButton from "@/components/program/RestartButton";
import ProgramMedia from "@/components/program/ProgramMedia";
import { cookies } from "next/headers"; // If reading token from cookies server-side

interface Program {
  _id: string;
  name: string;
  description: string;
  coachName?: string;
  dailySchedule: any[];
  completionPercentage: number;
  videos: any[];
  pdfs: any[];
}

export default async function ProgramContentPage({
  params,
}: {
  params: { programId: string };
}) {
  const { programId } = params;

  // 🔥 Fetch token from cookies if set there (preferred)
  const cookieStore = await cookies();
const token = cookieStore.get("token")?.value;


  // 🔥 Fetch program data
  const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
    headers: {
      Authorization: `Bearer ${token || process.env.NEXT_PUBLIC_USER_TOKEN}`, // fallback env token
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "include", // ensure cookies sent if needed
  });

  if (!res.ok) {
    return <div>Program yüklenirken hata oluştu.</div>;
  }

  const program: Program = await res.json();

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
