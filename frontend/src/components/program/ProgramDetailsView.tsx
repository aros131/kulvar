// src/components/program/ProgramDetailsView.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Program } from "@/types/program";
import { completeSession } from "@/utils/completeSession";

// ---------- small UI bits ----------
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${className}`}>{children}</div>
);
const Separator: React.FC = () => <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-6" />;

// ---------- helpers ----------
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const z = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d?: string | Date) => {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "-";
  return `${dt.getFullYear()}-${z(dt.getMonth() + 1)}-${z(dt.getDate())} ${z(dt.getHours())}:${z(dt.getMinutes())}`;
};
const norm = (s?: string) => (s ?? "").toString().trim().toLowerCase();

// ---------- schedule types ----------
type DSVideoUrl = { url?: string; description?: string };
type DSExercise = { name?: string; sets?: number; reps?: number; duration?: string; restTime?: number; videoUrls?: DSVideoUrl[] };
type DSSession = { name?: string; completed?: boolean; sessionId?: string; _id?: string; id?: string; exercises?: DSExercise[] };
type DSDay = { day?: string; notes?: string; sessions?: DSSession[] };

// incoming “completed” shapes you *might* pass from the page
type CompletedRaw =
  | string
  | { sessionId?: string; name?: string; status?: string; completed?: boolean };

type Props = {
  program: Program;
  programId: string;

  /** Optional: if the page already fetched progress, pass them in. */
  completedSessionIds?: string[] | Set<string>;
  completedSessions?: CompletedRaw[];
};

export default function ProgramDetailsView({
  program,
  programId,
  completedSessionIds,
  completedSessions,
}: Props) {
  // 1) If the parent didn’t pass completion info, we’ll fetch it ourselves
  const [fetchedCompleted, setFetchedCompleted] = useState<string[]>([]);
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (completedSessionIds || completedSessions) return; // parent controls it
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
        const res = await fetch(`${API}/progress/user/${programId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Accept": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (aborted || !data) return;
        const ids = arr<any>(data.completedSessions).map((s) => String(s?.sessionId || "").trim()).filter(Boolean);
        setFetchedCompleted(ids);
      } catch {
        // ignore – just don’t auto-mark
      }
    })();
    return () => { aborted = true; };
  }, [API, programId, completedSessionIds, completedSessions]);

  // 2) Build a set of “completed tokens” (ids + names) we can match quickly
  const completedTokens = useMemo(() => {
    const tokens = new Set<string>();

    // a) from ids set/array prop
    if (completedSessionIds) {
      const source = completedSessionIds instanceof Set ? Array.from(completedSessionIds) : completedSessionIds;
      source.forEach((v) => { const n = norm(v); if (n) tokens.add(n); });
    }

    // b) from raw objects prop
    arr<CompletedRaw>(completedSessions).forEach((r) => {
      if (typeof r === "string") {
        const n = norm(r);
        if (n) tokens.add(n);
      } else if (r && typeof r === "object") {
        const a = norm((r as any).sessionId);
        const b = norm((r as any).name);
        if (a) tokens.add(a);
        if (b) tokens.add(b);
      }
    });

    // c) from our own fetch fallback
    fetchedCompleted.forEach((id) => { const n = norm(id); if (n) tokens.add(n); });

    return tokens;
  }, [completedSessionIds, completedSessions, fetchedCompleted]);

  // 3) optimistic local completions (no full reload)
  const [localDone, setLocalDone] = useState<Set<string>>(new Set());
  useEffect(() => setLocalDone(new Set()), [programId]);

  // 4) normalize schedule
  const days = useMemo(() => arr<DSDay>(program.dailySchedule), [program.dailySchedule]);

  const isDone = (s: DSSession, fallbackKey: string) => {
    if (s?.completed === true) return true; // baked in
    const candidates = [s?.sessionId, s?._id, s?.id, s?.name, fallbackKey].map(norm).filter(Boolean);
    return candidates.some((c) => completedTokens.has(c) || localDone.has(c));
  };
  const markLocal = (s: DSSession, fallbackKey: string) => {
    const next = new Set(localDone);
    [s?.sessionId, s?._id, s?.id, s?.name, fallbackKey].map(norm).filter(Boolean).forEach((k) => next.add(k!));
    setLocalDone(next);
  };

  return (
    <section className="space-y-8">
      {/* SUMMARY (no createdAt, no coachId, no assignedClients) */}
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

      {/* DAILY SCHEDULE + COMPLETE */}
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
                        const fallbackKey = `day-${dIdx + 1}-s-${sIdx + 1}`;
                        const sid = s.sessionId ?? s._id ?? s.id ?? fallbackKey;
                        const done = isDone(s, fallbackKey);
                        return (
                          <li key={`${fallbackKey}-${sid}`} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{s?.name || `Seans ${sIdx + 1}`}</div>

                              {!done ? (
                                <CompleteButton
                                  programId={programId}
                                  sessionId={String(sid)}
                                  sessionName={s?.name}
                                  onOk={() => markLocal(s, fallbackKey)}
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

      {/* MEDIA */}
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
    if (!programId) {
      setErr("programId gerekli");
      return;
    }
    try {
      setPending(true);
      setErr(null);
      await completeSession(programId, sessionId, sessionName);
      onOk?.(); // optimistic mark
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
