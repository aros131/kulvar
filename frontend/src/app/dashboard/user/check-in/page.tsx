"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

interface Program { _id: string; name: string; }
interface CheckIn {
  _id: string;
  week: number;
  date: string;
  weight?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  soreness?: number;
  steps?: number;
  completedWorkouts?: number;
  note?: string;
}

// Monday 00:00 .. next Monday 00:00, in the visitor's local time.
function currentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { from: monday.toISOString(), to: nextMonday.toISOString() };
}

const SCALE = [1, 2, 3, 4, 5];

function ScaleInput({ label, lo, hi, value, onChange }: {
  label: string; lo: string; hi: string; value: number | null; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {SCALE.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
              value === n ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lo}</span><span>{hi}</span>
      </div>
    </div>
  );
}

function CheckInCard({ c }: { c: CheckIn }) {
  const t = useTranslations("checkIn");
  const locale = useLocale();
  const d = new Date(c.date);
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{t("weekLabel", { week: c.week })}</span>
        <span className="text-xs text-muted-foreground">{d.toLocaleDateString(LOCALE_TAG[locale] || "tr-TR")}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {c.weight != null && <span>⚖️ {c.weight} kg</span>}
        {c.energyLevel != null && <span>{t("energyShort", { value: c.energyLevel })}</span>}
        {c.sleepQuality != null && <span>{t("sleepShort", { value: c.sleepQuality })}</span>}
        {c.stressLevel != null && <span>{t("stressShort", { value: c.stressLevel })}</span>}
        {c.soreness != null && <span>{t("sorenessShort", { value: c.soreness })}</span>}
        {c.steps != null && <span>{t("stepsShort", { value: c.steps.toLocaleString(LOCALE_TAG[locale] || "tr-TR") })}</span>}
        {c.completedWorkouts != null && <span>{t("workoutsShort", { value: c.completedWorkouts })}</span>}
      </div>
      {c.note && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{c.note}</p>}
    </div>
  );
}

export default function CheckInPage() {
  const t = useTranslations("checkIn");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [programId, setProgramId] = useState("");
  const [week, setWeek] = useState(1);
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [steps, setSteps] = useState("");
  const [autoWorkoutCount, setAutoWorkoutCount] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  useEffect(() => {
    const { from, to } = currentWeekRange();
    Promise.all([
      fetch(`${API}/progress/all-program-progress`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
      fetch(`${API}/check-ins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
      // Completed-this-week comes straight from the calendar (takvim) — a
      // workout only counts once it's actually been checked off there, so
      // this can't be fudged by typing a number into the check-in form.
      fetch(`${API}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
    ]).then(([prog, ci, ev]) => {
      const progs: Program[] = Array.isArray(prog.programs) ? prog.programs.map((p: any) => ({ _id: p.programId || p._id, name: p.programName || p.name })) : [];
      setPrograms(progs);
      if (progs.length > 0) setProgramId(progs[0]._id);
      setHistory(Array.isArray(ci.checkIns) ? ci.checkIns : []);
      const events: { status?: string }[] = Array.isArray(ev.events) ? ev.events : [];
      setAutoWorkoutCount(events.filter(e => e.status === "completed").length);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          programId: programId || null,
          week: Number(week),
          weight: weight ? parseFloat(weight) : null,
          energyLevel: energy,
          sleepQuality: sleep,
          stressLevel: stress,
          soreness,
          steps: steps ? parseInt(steps) : null,
          completedWorkouts: autoWorkoutCount,
          note,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(prev => [data.checkIn, ...prev]);
      setShowForm(false);
      setWeight(""); setEnergy(null); setSleep(null); setStress(null); setSoreness(null); setSteps(""); setNote("");
      toast.success(t("submitSuccess"));
    } catch {
      toast.error(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserPageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("heading")}</h1>
          <Button onClick={() => setShowForm(v => !v)} variant={showForm ? "outline" : "default"}>
            {showForm ? t("cancel") : t("sendCheckIn")}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("intro")}
        </p>

        {/* Form */}
        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-5">
            {programs.length > 1 && (
              <div>
                <label className="text-sm font-medium">{t("programLabel")}</label>
                <select
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">{t("weekFormLabel")}</label>
              <input
                type="number"
                min={1}
                value={week}
                onChange={e => setWeek(parseInt(e.target.value) || 1)}
                className="mt-1 w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("weightLabel")}</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={t("weightPlaceholder")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("stepsLabel")}</label>
              <input
                type="number"
                min="0"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                placeholder={t("stepsPlaceholder")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <ScaleInput label={t("energyLevel")} lo={t("energyLow")} hi={t("energyHigh")} value={energy} onChange={setEnergy} />
            <ScaleInput label={t("sleepQuality")} lo={t("sleepLow")} hi={t("sleepHigh")} value={sleep} onChange={setSleep} />
            <ScaleInput label={t("stressLevel")} lo={t("stressLow")} hi={t("stressHigh")} value={stress} onChange={setStress} />
            <ScaleInput label={t("sorenessLevel")} lo={t("sorenessLow")} hi={t("sorenessHigh")} value={soreness} onChange={setSoreness} />

            <div>
              <label className="text-sm font-medium">{t("completedWorkoutsLabel")}</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-semibold">{t("workoutsAuto", { count: autoWorkoutCount ?? 0 })}</span>
                <span className="text-xs text-muted-foreground">{t("workoutsAutoHint")}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("noteLabel")}</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder={t("notePlaceholder")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t("submitting") : t("send")}
            </Button>
          </form>
        )}

        {/* History */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-4xl">📋</p>
            <p className="font-semibold">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("historyTitle")}</h2>
            {history.map(c => <CheckInCard key={c._id} c={c} />)}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
