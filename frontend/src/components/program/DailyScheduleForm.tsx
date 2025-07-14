"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
export interface DailyEntry {
  day: string;
  sessions: {
    name: string;
    exercises: {
      name: string;
      sets: number;
      reps: number;
      duration: string;
      restTime: number;
      videoUrls: {
        url: string;
        description: string;
      }[];
    }[];
  }[];
  notes: string;
}

interface VideoUrl {
  url: string;
  description: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration: string;
  restTime: number;
  videoUrls: VideoUrl[];
}

interface Session {
  name: string;
  exercises: Exercise[];
}



interface Props {
  onChange: (dailySchedule: DailyEntry[]) => void;
}

const initialDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function DailyScheduleForm({ onChange }: Props) {
  const [schedule, setSchedule] = useState<DailyEntry[]>(
    initialDays.map((day) => ({ day, sessions: [], notes: "" }))
  );

  const updateSchedule = (newSchedule: DailyEntry[]) => {
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  const addSession = (dayIndex: number) => {
    const updated = [...schedule];
    updated[dayIndex].sessions.push({ name: "", exercises: [] });
    updateSchedule(updated);
  };

  const updateSessionName = (dayIndex: number, sessionIndex: number, name: string) => {
    const updated = [...schedule];
    updated[dayIndex].sessions[sessionIndex].name = name;
    updateSchedule(updated);
  };

  const addExercise = (dayIndex: number, sessionIndex: number) => {
    const updated = [...schedule];
    updated[dayIndex].sessions[sessionIndex].exercises.push({
      name: "",
      sets: 0,
      reps: 0,
      duration: "0 dakika",
      restTime: 0,
      videoUrls: [],
    });
    updateSchedule(updated);
  };

  const updateExerciseField = <K extends keyof Exercise>(
  dayIndex: number,
  sessionIndex: number,
  exerciseIndex: number,
  field: K,
  value: Exercise[K]
) => {
  const updated = [...schedule];
  updated[dayIndex].sessions[sessionIndex].exercises[exerciseIndex][field] = value;
  updateSchedule(updated);
};


  return (
    <ScrollArea className="h-[500px] pr-2">
      {schedule.map((day, dayIndex) => (
        <div key={day.day} className="mb-6 border p-4 rounded">
          <h3 className="text-lg font-bold mb-2">{day.day}</h3>

          {day.sessions.map((session, sessionIndex) => (
            <div key={sessionIndex} className="mb-4 p-2 border rounded">
              <Input
                placeholder="Oturum Adı"
                value={session.name}
                onChange={(e) => updateSessionName(dayIndex, sessionIndex, e.target.value)}
                className="mb-2"
              />
              {session.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    placeholder="Egzersiz Adı"
                    value={exercise.name}
                    onChange={(e) =>
                      updateExerciseField(dayIndex, sessionIndex, exerciseIndex, "name", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Set"
                    value={exercise.sets}
                    onChange={(e) =>
                      updateExerciseField(dayIndex, sessionIndex, exerciseIndex, "sets", Number(e.target.value))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Tekrar"
                    value={exercise.reps}
                    onChange={(e) =>
                      updateExerciseField(dayIndex, sessionIndex, exerciseIndex, "reps", Number(e.target.value))
                    }
                  />
                  <Input
                    placeholder="Süre (örn. 30 dakika)"
                    value={exercise.duration}
                    onChange={(e) =>
                      updateExerciseField(dayIndex, sessionIndex, exerciseIndex, "duration", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Dinlenme Süresi (sn)"
                    value={exercise.restTime}
                    onChange={(e) =>
                      updateExerciseField(dayIndex, sessionIndex, exerciseIndex, "restTime", Number(e.target.value))
                    }
                  />
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={() => addExercise(dayIndex, sessionIndex)}>
                + Egzersiz Ekle
              </Button>
            </div>
          ))}

          <Textarea
            placeholder="Günlük not..."
            value={day.notes}
            onChange={(e) => {
              const updated = [...schedule];
              updated[dayIndex].notes = e.target.value;
              updateSchedule(updated);
            }}
            className="mb-2"
          />

          <Button size="sm" onClick={() => addSession(dayIndex)}>
            + Oturum Ekle
          </Button>
        </div>
      ))}
    </ScrollArea>
  );
}
