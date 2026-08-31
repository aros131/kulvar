"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface Program { _id: string; name: string; }
interface CheckIn {
  _id: string;
  week: number;
  date: string;
  weight?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  completedWorkouts?: number;
  note?: string;
}

const SCALE = [1, 2, 3, 4, 5];
const SCALE_LABELS: Record<string, [string, string]> = {
  energyLevel:  ["Çok Düşük", "Çok Yüksek"],
  sleepQuality: ["Çok Kötü",  "Mükemmel"],
  stressLevel:  ["Hiç Yok",   "Çok Fazla"],
};

function ScaleInput({ label, field, value, onChange }: {
  label: string; field: string; value: number | null; onChange: (v: number) => void;
}) {
  const [lo, hi] = SCALE_LABELS[field] ?? ["", ""];
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
  const d = new Date(c.date);
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{c.week}. Hafta</span>
        <span className="text-xs text-muted-foreground">{d.toLocaleDateString("tr-TR")}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {c.weight != null && <span>⚖️ {c.weight} kg</span>}
        {c.energyLevel != null && <span>⚡ Enerji {c.energyLevel}/5</span>}
        {c.sleepQuality != null && <span>😴 Uyku {c.sleepQuality}/5</span>}
        {c.stressLevel != null && <span>🧠 Stres {c.stressLevel}/5</span>}
        {c.completedWorkouts != null && <span>💪 {c.completedWorkouts} antrenman</span>}
      </div>
      {c.note && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{c.note}</p>}
    </div>
  );
}

export default function CheckInPage() {
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
  const [workouts, setWorkouts] = useState("");
  const [note, setNote] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/progress/all-program-progress`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
      fetch(`${API}/check-ins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
    ]).then(([prog, ci]) => {
      const progs: Program[] = Array.isArray(prog.programs) ? prog.programs.map((p: any) => ({ _id: p.programId || p._id, name: p.programName || p.name })) : [];
      setPrograms(progs);
      if (progs.length > 0) setProgramId(progs[0]._id);
      setHistory(Array.isArray(ci.checkIns) ? ci.checkIns : []);
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
          completedWorkouts: workouts ? parseInt(workouts) : null,
          note,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(prev => [data.checkIn, ...prev]);
      setShowForm(false);
      setWeight(""); setEnergy(null); setSleep(null); setStress(null); setWorkouts(""); setNote("");
      toast.success("Check-in gönderildi! Koçun görebilir.");
    } catch {
      toast.error("Gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserPageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Haftalık Check-in</h1>
          <Button onClick={() => setShowForm(v => !v)} variant={showForm ? "outline" : "default"}>
            {showForm ? "İptal" : "Check-in Gönder"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Her hafta nasıl hissettiğini koçunla paylaş. Bu bilgiler programını optimize etmesine yardımcı olur.
        </p>

        {/* Form */}
        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-5">
            {programs.length > 1 && (
              <div>
                <label className="text-sm font-medium">Program</label>
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
              <label className="text-sm font-medium">Hafta</label>
              <input
                type="number"
                min={1}
                value={week}
                onChange={e => setWeek(parseInt(e.target.value) || 1)}
                className="mt-1 w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Kilo (kg, isteğe bağlı)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="örn. 78.5"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <ScaleInput label="Enerji Seviyesi" field="energyLevel" value={energy} onChange={setEnergy} />
            <ScaleInput label="Uyku Kalitesi" field="sleepQuality" value={sleep} onChange={setSleep} />
            <ScaleInput label="Stres Seviyesi" field="stressLevel" value={stress} onChange={setStress} />

            <div>
              <label className="text-sm font-medium">Bu hafta tamamlanan antrenman sayısı</label>
              <input
                type="number"
                min={0}
                value={workouts}
                onChange={e => setWorkouts(e.target.value)}
                placeholder="örn. 3"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Not / Koça mesaj (isteğe bağlı)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Bu hafta nasıl geçti? Zorluk yaşadın mı?"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Gönderiliyor..." : "Gönder"}
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
            <p className="font-semibold">Henüz check-in yok</p>
            <p className="text-sm text-muted-foreground">İlk haftalık check-in'ini gönder.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Geçmiş</h2>
            {history.map(c => <CheckInCard key={c._id} c={c} />)}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
