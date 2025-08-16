// src/components/program/ProgramPlan.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Program } from "@/types/program";
import { completeSession } from "@/utils/completeSession";

// --- small UI helpers (local), no shadcn imports required ---
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${className}`}>{children}</div>
);
const Separator: React.FC = () => <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-6" />;

// --- tiny runtime helpers ---
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const z = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d?: string | Date) => {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "-";
  return `${dt.getFullYear()}-${z(dt.getMonth() + 1)}-${z(dt.getDate())} ${z(dt.getHours())}:${z(dt.getMinutes())}`;
};

// --- types used in the schedule sections ---
type DSVideoUrl = { url?: string; description?: string };
type DSExercise = { name?: string; sets?: number; reps?: number; duration?: string; restTime?: number; videoUrls?: DSVideoUrl[] };
type DSSession = {
  name?: string;
  completed?: boolean;         // ← we’ll respect this now
  sessionId?: string;
  _id?: string;
  id?: string;
  exercises?: DSExercise[];
};
type DSDay = { day?: string; notes?: string; sessions?: DSSession[] };

type Props = {
  program: Program;
  programId: string;
  /** array OR set of completed session ids (ids *or* names) */
  completedSessionIds?: string[] | Set<string>;
  /** when a session completes successfully */
  onCompleted?: (sessionId?: string) => void;
};

export default function ProgramPlan({ program, programId, completedSessionIds, onCompleted }: Props) {
  // normalize completed ids (may contain ids or names depending on backend)
  const completedSet = useMemo(() => {
    if (!completedSessionIds) return new Set<string>();
    return completedSessionIds instanceof Set ? completedSessionIds : new Set(completedSessionIds);
  }, [completedSessionIds]);

  // build a stable list of days/sessions with candidate session ids
  const days = useMemo(() => arr<DSDay>(program.dailySchedule), [program.dailySchedule]);

  // optimistic local toggle (so we don't need reload)
  const [completedLocal, setCompletedLocal] = useState<Set<string>>(new Set());
  useEffect(() => setCompletedLocal(new Set()), [programId]);

  const inAnyCompletedSet = (key?: string) => {
    if (!key) return false;
    return completedSet.has(key) || completedLocal.has(key);
  };

  const markLocalCompleted = (...keys: (string | undefined)[]) => {
    setCompletedLocal(prev => {
      const next = new Set(prev);
      keys.forEach(k => { if (k) next.add(k); });
      return next;
    });
  };

  return (
    <section className="space-y-8">
      {/* SUMMARY (no createdAt, no coachId, no assigned clients) */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold">{program.name ?? "Program"}</h2>
        {program.description && <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{program.description}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Süre (hafta)" value={String((program as any).duration ?? "—")} />
          <Info label="Zorluk" value={String((program as any).difficulty ?? "—")} />
          <Info label="Hedef" value={String((program as any).fitnessGoal ?? "—")} />
          <Info label="Durum" value={String((program as any).status ?? "—")} />
        </div>
      </Card>

      <Separator />

      {/* DAILY SCHEDULE + COMPLETE BUTTONS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Günlük Program</h3>
        {days.length === 0 ? (
          <p className="text-sm text-zinc-500">Plan yok.</p>
        ) : (
          <div className="space-y-4">
            {days.map((day, dIdx) => {
              const dayLabel = day?.day || `Gün ${dIdx + 1}`;
              const sessions = arr<DSSession>(day?.sessions);
              return (
                <Card key={dIdx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{dayLabel}</div>
                    {day?.notes && <div className="text-xs text-zinc-500">Not: {day.notes}</div>}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-sm text-zinc-500">Seans yok.</div>
                  ) : (
                    <ul className="space-y-3">
                      {sessions.map((s, sIdx) => {
                        const sid = s.sessionId ?? s._id ?? s.id ?? `day-${dIdx + 1}-s-${sIdx + 1}`;

                        // ✅ decide completion:
                        // 1) respect s.completed
                        // 2) if id or name is in completed set
                        // 3) if optimistically completed
                        const done =
                          Boolean(s?.completed) ||
                          inAnyCompletedSet(sid) ||
                          inAnyCompletedSet(s?.name);

                        return (
                          <li key={sid} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{s?.name || `Seans ${sIdx + 1}`}</div>

                              {!done ? (
                                <CompleteButton
                                  programId={programId}
                                  sessionId={sid}
                                  sessionName={s?.name}
                                  onOk={() => {
                                    // mark by both id and name so either matching strategy works
                                    markLocalCompleted(sid, s?.name);
                                    onCompleted?.(sid);
                                  }}
                                />
                              ) : (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                  Tamamlandı
                                </span>
                              )}
                            </div>

                            {/* Exercises */}
                            {arr<DSExercise>(s?.exercises).length === 0 ? (
                              <div className="text-sm text-zinc-500">Egzersiz yok.</div>
                            ) : (
                              <ul className="space-y-2 text-sm">
                                {arr<DSExercise>(s?.exercises).map((ex, eIdx) => (
                                  <li key={`${sid}-ex-${eIdx}`} className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold">{ex?.name ?? `Egzersiz ${eIdx + 1}`}</span>
                                      {typeof ex?.sets === "number" && <span>• {ex.sets} set</span>}
                                      {typeof ex?.reps === "number" && <span>• {ex.reps} tekrar</span>}
                                      {ex?.duration && <span>• {ex.duration}</span>}
                                      {typeof ex?.restTime === "number" && <span>• Dinlenme: {ex.restTime}s</span>}
                                    </div>
                                    {arr<DSVideoUrl>(ex?.videoUrls).length > 0 && (
                                      <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                                        {arr<DSVideoUrl>(ex?.videoUrls).map((v, vi) => (
                                          <li key={`${sid}-ex-${eIdx}-v-${vi}`}>
                                            {v?.url ? (
                                              <a className="underline" href={v.url} target="_blank" rel="noreferrer">
                                                {v.url}
                                              </a>
                                            ) : (
                                              <span>Link</span>
                                            )}
                                            {v?.description ? <span className="ml-2 text-zinc-500">({v.description})</span> : null}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* STANDALONE EXERCISES */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Bağımsız Egzersizler</h3>
        {arr<any>(program.exercises).length === 0 ? (
          <p className="text-sm text-zinc-500">Egzersiz yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.exercises).map((ex, i) => (
              <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3">
                <div className="font-medium">{ex?.name || `Egzersiz ${i + 1}`}</div>
                <div className="text-zinc-600 dark:text-zinc-300">
                  {typeof ex?.sets === "number" && <span className="mr-2">{ex.sets} set</span>}
                  {typeof ex?.reps === "number" && <span className="mr-2">{ex.reps} tekrar</span>}
                  {ex?.duration && <span className="mr-2">{ex.duration}</span>}
                </div>
                {arr<DSVideoUrl>(ex?.videoUrls).length > 0 && (
                  <div className="mt-1 text-xs">
                    {arr<DSVideoUrl>(ex?.videoUrls).map((v, vi) => (
                      <div key={vi}>
                        {v?.url ? (
                          <a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.url}</a>
                        ) : "Link"}
                        {v?.description ? <span className="ml-1 text-zinc-500">({v.description})</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* NUTRITION PLAN */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Beslenme Planı</h3>
        {arr<string>(program?.nutritionPlan?.tips).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">İpuçları</div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {arr<string>(program?.nutritionPlan?.tips).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
        {arr<any>(program?.nutritionPlan?.meals).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">Öğünler</div>
            <ul className="space-y-2 text-sm">
              {arr<any>(program?.nutritionPlan?.meals).map((m, i) => (
                <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m?.name || `Öğün ${i + 1}`}</div>
                    {m?.description && <div className="text-zinc-500">{m.description}</div>}
                  </div>
                  <div className="text-xs text-zinc-500">{m?.time || "-"}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Separator />

      {/* MEDIA: VIDEOS + PDFS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Videolar (URL)</h3>
        {arr<any>(program.videos).length === 0 ? (
          <p className="text-sm text-zinc-500">Video yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.videos).map((v, i) => (
              <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{v?.name || `Video ${i + 1}`}</div>
                  {v?.description && <div className="text-zinc-500">{v.description}</div>}
                </div>
                {v?.url ? <a className="underline text-sm" href={v.url} target="_blank" rel="noreferrer">Aç</a> : <span className="text-xs text-zinc-400">—</span>}
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-lg font-semibold">PDF’ler (URL)</h3>
        {arr<any>(program.pdfs).length === 0 ? (
          <p className="text-sm text-zinc-500">PDF yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.pdfs).map((v, i) => (
              <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{v?.name || `PDF ${i + 1}`}</div>
                  {v?.description && <div className="text-zinc-500">{v.description}</div>}
                </div>
                {v?.url ? <a className="underline text-sm" href={v.url} target="_blank" rel="noreferrer">Aç</a> : <span className="text-xs text-zinc-400">—</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* ANNOUNCEMENTS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Duyurular</h3>
        {arr<any>(program.announcements).length === 0 ? (
          <p className="text-sm text-zinc-500">Duyuru yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.announcements).map((a, i) => (
              <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
                <span className="text-zinc-700 dark:text-zinc-300">{a?.message || "-"}</span>
                <span className="text-xs text-zinc-500">{fmtDate(a?.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* PROGRESS TABLE (from ProgramDetailsView) */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">İlerleme</h3>
        {arr<any>(program.progressTracking).length === 0 ? (
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
                {arr<any>(program.progressTracking).map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2"><code className="bg-zinc-100 px-1 py-0.5 rounded">{String(p?.userId ?? "-")}</code></td>
                    <td className="py-1 pr-2">{typeof p?.progressPercentage === "number" ? `${p.progressPercentage.toFixed(1)}%` : "-"}</td>
                    <td className="py-1 pr-2">{typeof p?.completedSessions === "number" ? p.completedSessions : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Separator />

      {/* MISSED/RESCHEDULED */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Kaçırılan / Yeniden Planlanan Antrenmanlar</h3>
        {arr<any>(program.missedWorkouts).length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıt yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.missedWorkouts).map((m, i) => (
              <li key={i} className="rounded border border-zinc-200 dark:border-zinc-800 p-3 flex gap-3 items-center">
                <span className={`text-xs px-2 py-1 rounded ${m?.status === "missed" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"}`}>
                  {m?.status ?? "—"}
                </span>
                <span>Gün: {m?.missedDay ?? "-"}</span>
                {typeof m?.rescheduledTo === "number" && <span>→ {m.rescheduledTo}. gün</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function CompleteButton({
  programId,
  sessionId,
  sessionName,
  onOk,
}: {
  programId: string;
  sessionId?: string;
  sessionName?: string;
  onOk?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    if (!programId || (!sessionId && !sessionName)) {
      setErr("programId ve (sessionId | sessionName) gerekli");
      return;
    }
    try {
      setPending(true);
      setErr(null);
      await completeSession(programId, sessionId, sessionName);
      onOk?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        aria-label="Seansı tamamla"
      >
        {pending ? "Kaydediliyor…" : "Tamamla"}
      </button>
      {err && <div className="text-sm text-red-600 mt-1" role="alert">{err}</div>}
    </div>
  );
}
