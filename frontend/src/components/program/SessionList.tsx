// components/program/SessionList.tsx

import React from "react";
import { Button } from "@/components/ui/button";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration: string;
}

interface Session {
  name: string;
  exercises: Exercise[];
  completed?: boolean;
}

interface Day {
  day: string;
  sessions: Session[];
}

interface SessionListProps {
  dailySchedule: Day[];
  onMarkCompleted: (dayIndex: number, sessionIndex: number) => void;
  onSubmitFeedback: (dayIndex: number, sessionIndex: number) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  dailySchedule,
  onMarkCompleted,
  onSubmitFeedback
}) => {
  return (
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
    <h2 className="text-lg font-semibold mb-2">Program Takvimi</h2>
    {dailySchedule && dailySchedule.length > 0 ? (
      dailySchedule.map((day, dayIndex) => (
        <div key={dayIndex} className="mb-4">
          <h3 className="text-md font-bold">{day.day}</h3>
          {day.sessions && day.sessions.length > 0 ? (
            day.sessions.map((session, sessionIndex) => (
              <div key={sessionIndex} className="border rounded p-3 mt-2">
                <p className="font-medium">{session.name}</p>
                <ul className="ml-4 list-disc">
                  {session.exercises && session.exercises.length > 0 ? (
                    session.exercises.map((ex, i) => (
                      <li key={i}>
                        {ex.name} – {ex.sets}x{ex.reps} ({ex.duration})
                      </li>
                    ))
                  ) : (
                    <li>No exercises found.</li>
                  )}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => onMarkCompleted(dayIndex, sessionIndex)}
                  >
                    Tamamlandı
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onSubmitFeedback(dayIndex, sessionIndex)}
                  >
                    Geri Bildirim
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p>No sessions found for this day.</p>
          )}
        </div>
      ))
    ) : (
      <p>No program schedule available.</p>
    )}
  </div>
);

};

export default SessionList;
