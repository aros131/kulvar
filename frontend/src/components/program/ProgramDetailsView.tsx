"use client";

import React, { JSX } from "react";
import { Card } from "@/components/ui/card";

// Local fallback Separator since shadcn/ui/separator is not present
const Separator: React.FC = () => (
  <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-4" />
);

// ---- Types matching your Program schema (no `any`) ----
type Id = string;

type BadgeColor = "green" | "blue" | "amber" | "zinc" | "red";

// A client can be either a populated object or just an Id
type Assigned = Id | { _id: Id; name?: string; email?: string };

type DSVideoUrl = { url?: string; description?: string };
type DSExercise = {
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  restTime?: number;
  videoUrls?: DSVideoUrl[];
};
type DSSession = { name: string; exercises?: DSExercise[] };
type DSDay = { day: string; notes?: string; sessions?: DSSession[] };

type StandaloneExercise = { name: string; sets?: number; reps?: number; duration?: string; videoUrls?: DSVideoUrl[] };

type NutritionPlan = {
  tips?: string[];
  meals?: { name?: string; description?: string; time?: string }[];
};

type MediaItem = { name: string; url: string; description?: string };

type Announcement = { message?: string; date?: string | Date };

type ProgressTrack = {
  user?: Id; // might be populated or raw id; we show id safely
  progressPercentage?: number;
  completedSessions?: number;
};

type FeedbackItem = {
  userId?: Id;
  comment?: string;
  rating?: number; // 1..5
  session?: string;
  createdAt?: string | Date;
};

type MissedWorkout = {
  missedDay: number;
  rescheduledTo?: number;
  status: "Kaçırıldı" | "Yeniden Planlandı";
};

type ProgramModel = {
  _id: Id;
  name: string;
  description: string;
  duration: number;
  coachId: Id;
  assignedClients?: Assigned[];

  difficulty: "Başlangıç" | "Orta Düzey" | "İleri Seviye";
  fitnessGoal:
    | "Kilo Kaybı"
    | "Kas Kazanımı"
    | "Dayanıklılık"
    | "Genel Fitness"
    | "Genel Fitness ve Güç Geliştirme"
    | "Hedefe Özel Gelişim";

  dailySchedule?: DSDay[];
  exercises?: StandaloneExercise[];

  nutritionPlan?: NutritionPlan;

  videos?: MediaItem[];
  pdfs?: MediaItem[];

  announcements?: Announcement[];

  progressTracking?: ProgressTrack[];

  feedback?: FeedbackItem[];

  missedWorkouts?: MissedWorkout[];

  status?: "Aktif" | "Tamamlandı" | "Durduruldu";
  createdAt?: string | Date;
};

// Accept a looser shape (works with your existing `Program` type)
// NOTE: We deliberately use broad `string` for enums to accept API types like `string | undefined`.
type ProgramLike = {
  _id?: Id;
  name?: string;
  description?: string;
  duration?: number;
  coachId?: Id;
  assignedClients?: Assigned[];
  difficulty?: string; // broadened from literal union
  fitnessGoal?: string; // broadened from literal union
  dailySchedule?: DSDay[];
  exercises?: StandaloneExercise[];
  nutritionPlan?: NutritionPlan;
  videos?: MediaItem[];
  pdfs?: MediaItem[];
  announcements?: Announcement[];
  progressTracking?: ProgressTrack[];
  feedback?: FeedbackItem[];
  missedWorkouts?: MissedWorkout[];
  status?: string; // broadened from literal union
  createdAt?: string | Date;
};

export function ProgramDetailsView({ program }: { program: ProgramLike }): JSX.Element {

  // ---- Helpers ----
  const fmtDate = (d?: string | Date) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const Badge = ({ children, color }: { children: React.ReactNode; color?: BadgeColor }) => {
    const map: Record<BadgeColor, string> = {
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      amber: "bg-amber-100 text-amber-800 border-amber-200",
      red: "bg-red-100 text-red-800 border-red-200",
      zinc: "bg-zinc-100 text-zinc-800 border-zinc-200",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${map[color || "zinc"]}`}>
        {children}
      </span>
    );
  };

  const StatusBadge = () => {
    const st = program.status || "Aktif";
    const c: BadgeColor = st === "Aktif" ? "green" : st === "Durduruldu" ? "amber" : "blue";
    return <Badge color={c}>{st}</Badge>;
  };

  const DifficultyBadge = () => {
    const diff = program.difficulty || "Başlangıç";
    const c: BadgeColor = diff === "Başlangıç" ? "green" : diff === "Orta Düzey" ? "amber" : "red";
    return <Badge color={c}>{diff}</Badge>;
  };

  const GoalBadge = () => <Badge color="blue">{program.fitnessGoal || "Hedef Yok"}</Badge>;

  // generic safe array
  const arr = <T,>(v?: T[]) => (Array.isArray(v) ? v : []);
  // specific safeties to avoid generic inference clashes
  const safeAssigned = (v?: Assigned[]) => (Array.isArray(v) ? v : []);
  const safeStr = (v?: string[]) => (Array.isArray(v) ? v : []);

  const showAssignedClient = (c: Assigned) => {
    if (typeof c === "string")
      return (
        <span key={c} className="text-xs rounded bg-zinc-100 px-2 py-0.5">
          {c}
        </span>
      );
    return (
      <span key={c._id} className="text-xs rounded bg-zinc-100 px-2 py-0.5">
        {c.name || c._id} {c.email ? `• ${c.email}` : ""}
      </span>
    );
  };

  // ---- Render ----
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{program.name ?? "Program"}</h1>
          <StatusBadge />
          <DifficultyBadge />
          <GoalBadge />
        </div>
        <p className="text-zinc-700 dark:text-zinc-300">{program.description || "Açıklama yok"}</p>
        <div className="text-sm text-zinc-500 flex flex-wrap gap-3">
          <span>
            Süre: <strong>{typeof program.duration === "number" ? program.duration : "-"}</strong> hafta
          </span>
          <span>Oluşturma: {fmtDate(program.createdAt)}</span>
          <span>
            Koç: <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">{program.coachId ? String(program.coachId) : "-"}</code>
          </span>
        </div>

        {safeAssigned(program.assignedClients).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-sm font-medium">Atanan Danışanlar:</span>
            {safeAssigned(program.assignedClients).map((c) => showAssignedClient(c))}
          </div>
        )}
      </section>

      <Separator />

      {/* Daily Schedule */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Günlük Program</h2>
        {arr(program.dailySchedule).length === 0 ? (
          <p className="text-sm text-zinc-500">Plan yok.</p>
        ) : (
          <div className="space-y-4">
            {arr(program.dailySchedule).map((day, dIdx) => (
              <Card key={dIdx} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{day.day || `Gün ${dIdx + 1}`}</div>
                  {day.notes && <div className="text-xs text-zinc-500">Not: {day.notes}</div>}
                </div>

                {arr(day.sessions).length === 0 ? (
                  <div className="text-sm text-zinc-500">Seans yok.</div>
                ) : (
                  <div className="space-y-3">
                    {arr(day.sessions).map((s, sIdx) => (
                      <div key={sIdx} className="border rounded p-3 space-y-2">
                        <div className="font-medium">{s.name || `Seans ${sIdx + 1}`}</div>

                        {arr(s.exercises).length === 0 ? (
                          <div className="text-sm text-zinc-500">Egzersiz yok.</div>
                        ) : (
                          <ul className="space-y-2 text-sm">
                            {arr(s.exercises).map((ex, eIdx) => (
                              <li key={eIdx} className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">{ex.name}</span>
                                  {typeof ex.sets === "number" && <span>• {ex.sets} set</span>}
                                  {typeof ex.reps === "number" && <span>• {ex.reps} tekrar</span>}
                                  {ex.duration && <span>• {ex.duration}</span>}
                                  {typeof ex.restTime === "number" && <span>• Dinlenme: {ex.restTime}s</span>}
                                </div>
                                {/* Exercise video URLs */}
                                {arr(ex.videoUrls).length > 0 && (
                                  <div className="pl-1">
                                    <div className="text-xs text-zinc-500">Videolar:</div>
                                    <ul className="list-disc pl-5">
                                      {arr(ex.videoUrls).map((v, i) =>
                                        v.url ? (
                                          <li key={i}>
                                            <a
                                              href={v.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline break-all"
                                            >
                                              {v.description || v.url}
                                            </a>
                                          </li>
                                        ) : null
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Standalone Exercises */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bağımsız Egzersizler</h2>
        {arr(program.exercises).length === 0 ? (
          <p className="text-sm text-zinc-500">Ek egzersiz yok.</p>
        ) : (
          <ul className="space-y-2">
            {arr(program.exercises).map((ex, i) => (
              <li key={i} className="border rounded p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{ex.name}</span>
                  {typeof ex.sets === "number" && <span>• {ex.sets} set</span>}
                  {typeof ex.reps === "number" && <span>• {ex.reps} tekrar</span>}
                  {ex.duration && <span>• {ex.duration}</span>}
                </div>
                {arr(ex.videoUrls).length > 0 && (
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {arr(ex.videoUrls).map((v, j) =>
                      v.url ? (
                        <li key={j}>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {v.description || v.url}
                          </a>
                        </li>
                      ) : null
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nutrition Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Beslenme Planı</h2>
        {safeStr(program.nutritionPlan?.tips).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">İpuçları</div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {safeStr(program.nutritionPlan?.tips).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {arr(program.nutritionPlan?.meals).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">Öğünler</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="text-left py-1 pr-2">Ad</th>
                    <th className="text-left py-1 pr-2">Açıklama</th>
                    <th className="text-left py-1 pr-2">Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {arr(program.nutritionPlan?.meals).map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1 pr-2">{m.name || "-"}</td>
                      <td className="py-1 pr-2">{m.description || "-"}</td>
                      <td className="py-1 pr-2">{m.time || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {safeStr(program.nutritionPlan?.tips).length === 0 &&
          arr(program.nutritionPlan?.meals).length === 0 && (
            <p className="text-sm text-zinc-500">Beslenme planı tanımlı değil.</p>
          )}
      </section>

      {/* Media (URLs) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Videolar (URL)</h2>
        {arr(program.videos).length === 0 ? (
          <p className="text-sm text-zinc-500">Video bulunamadı.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {arr(program.videos).map((v, i) => (
              <li key={i}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {v.name || v.url}
                </a>
                {v.description ? <span className="text-zinc-500"> — {v.description}</span> : null}
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-lg font-semibold mt-4">PDF’ler (URL)</h2>
        {arr(program.pdfs).length === 0 ? (
          <p className="text-sm text-zinc-500">PDF bulunamadı.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {arr(program.pdfs).map((v, i) => (
              <li key={i}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {v.name || v.url}
                </a>
                {v.description ? <span className="text-zinc-500"> — {v.description}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Announcements */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Duyurular</h2>
        {arr(program.announcements).length === 0 ? (
          <p className="text-sm text-zinc-500">Duyuru yok.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {arr(program.announcements).map((a, i) => (
              <li key={i}>
                <span className="font-medium">{fmtDate(a.date)}</span>
                {a.message ? <span className="ml-2">{a.message}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Progress Tracking */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">İlerleme</h2>
        {arr(program.progressTracking).length === 0 ? (
          <p className="text-sm text-zinc-500">İlerleme kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="text-left py-1 pr-2">Kullanıcı</th>
                  <th className="text-left py-1 pr-2">Tamamlama %</th>
                  <th className="text-left py-1 pr-2">Tamamlanan Seans</th>
                </tr>
              </thead>
              <tbody>
                {arr(program.progressTracking).map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">
                      <code className="bg-zinc-100 px-1 py-0.5 rounded">{String(p.user || "-")}</code>
                    </td>
                    <td className="py-1 pr-2">
                      {typeof p.progressPercentage === "number" ? `${p.progressPercentage.toFixed(1)}%` : "-"}
                    </td>
                    <td className="py-1 pr-2">{typeof p.completedSessions === "number" ? p.completedSessions : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Feedback */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Geri Bildirim</h2>
        {arr(program.feedback).length === 0 ? (
          <p className="text-sm text-zinc-500">Geri bildirim yok.</p>
        ) : (
          <ul className="space-y-2">
            {arr(program.feedback).map((f, i) => (
              <li key={i} className="border rounded p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Kullanıcı: </span>
                    <code className="bg-zinc-100 px-1 py-0.5 rounded">{String(f.userId || "-")}</code>
                    {f.session ? <span className="ml-2 text-zinc-500">({f.session})</span> : null}
                  </div>
                  {typeof f.rating === "number" && (
                    <div className="text-amber-500" aria-label={`Puan ${f.rating}/5`}>
                      {"★".repeat(Math.max(0, Math.min(5, Math.round(f.rating))))}
                      {"☆".repeat(Math.max(0, 5 - Math.round(f.rating)))}
                    </div>
                  )}
                </div>
                {f.comment && <div className="mt-1">{f.comment}</div>}
                <div className="text-xs text-zinc-500 mt-1">{fmtDate(f.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Missed / Rescheduled Workouts */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kaçırılan / Yeniden Planlanan Antrenmanlar</h2>
        {arr(program.missedWorkouts).length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {arr(program.missedWorkouts).map((m, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${
                  m.status === "Kaçırıldı"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}>
                  {m.status}
                </span>
                <span>Gün: {m.missedDay}</span>
                {typeof m.rescheduledTo === "number" && <span>→ {m.rescheduledTo}. gün</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ProgramDetailsView;
