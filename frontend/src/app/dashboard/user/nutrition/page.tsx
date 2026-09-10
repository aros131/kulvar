"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, X, Loader2 } from "lucide-react";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface MealItem {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  estimatedByAI?: boolean;
}

interface NutritionLog {
  _id: string;
  date: string; // YYYY-MM-DD
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  water?: number;
  items?: MealItem[];
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function totalsOf(items: MealItem[]) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: acc.protein + (Number(it.protein) || 0),
      carbs: acc.carbs + (Number(it.carbs) || 0),
      fat: acc.fat + (Number(it.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function NutritionLogCard({ log }: { log: NutritionLog }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{new Date(log.date).toLocaleDateString("tr-TR")}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {log.calories != null && <span>🔥 {log.calories} kcal</span>}
        {log.protein != null && <span>🥩 {log.protein}g protein</span>}
        {log.carbs != null && <span>🍞 {log.carbs}g karbonhidrat</span>}
        {log.fat != null && <span>🥑 {log.fat}g yağ</span>}
        {log.water != null && <span>💧 {log.water}ml su</span>}
      </div>
      {log.items && log.items.length > 0 && (
        <ul className="text-sm space-y-1 pt-1 border-t">
          {log.items.map((it, i) => (
            <li key={i} className="flex justify-between text-muted-foreground">
              <span>{it.description}</span>
              <span>{it.calories} kcal</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NutritionLogPage() {
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [history, setHistory] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState<MealItem[]>([]);
  const [water, setWater] = useState("");

  // Öğün ekleme mini-formu
  const [foodDesc, setFoodDesc] = useState("");
  const [draft, setDraft] = useState<MealItem | null>(null);
  const [estimating, setEstimating] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/progress/all-program-progress`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
      fetch(`${API}/nutrition-logs`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({})),
    ]).then(async ([prog, logs]) => {
      const list: NutritionLog[] = Array.isArray(logs.nutritionLogs) ? logs.nutritionLogs : [];
      setHistory(list);

      // Bugün için zaten girilmiş bir kayıt varsa, formu onunla doldur —
      // sayfadan çıkıp geri dönünce girdiklerin kaybolmasın.
      const todays = list.find(l => l.date === todayStr());
      if (todays) {
        setItems(todays.items ?? []);
        setWater(todays.water != null ? String(todays.water) : "");
      }

      const firstProgramId = prog?.programProgress?.[0]?.programId;
      if (firstProgramId) {
        try {
          const progRes = await fetch(`${API}/programs/${firstProgramId}`, { headers: { Authorization: `Bearer ${token}` } });
          const progData = await progRes.json();
          const target = (progData?.program || progData)?.nutritionPlan?.dailyCalorieTarget;
          if (typeof target === "number") setCalorieTarget(target);
        } catch {
          // no target configured or fetch failed — form just won't show the progress bar
        }
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tarih değiştirilirse o günün var olan kaydını yükle (yoksa temiz forma dön).
  const changeDate = (newDate: string) => {
    setDate(newDate);
    const existing = history.find(l => l.date === newDate);
    setItems(existing?.items ?? []);
    setWater(existing?.water != null ? String(existing.water) : "");
    setFoodDesc("");
    setDraft(null);
  };

  const persist = async (nextItems: MealItem[], nextWater: string) => {
    setSaving(true);
    const totals = totalsOf(nextItems);
    try {
      const res = await fetch(`${API}/nutrition-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          water: nextWater ? Number(nextWater) : null,
          items: nextItems,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(prev => [data.nutritionLog, ...prev.filter(l => l.date !== data.nutritionLog.date)]);
    } catch {
      toast.error("Kaydedilemedi, tekrar dener misin?");
    } finally {
      setSaving(false);
    }
  };

  const estimate = async () => {
    if (!foodDesc.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch(`${API}/ai/estimate-meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: foodDesc }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDraft({ description: foodDesc, ...data.estimate, estimatedByAI: true });
    } catch {
      toast.error("Tahmin yapılamadı, elle girebilirsin.");
      setDraft({ description: foodDesc, calories: 0, protein: 0, carbs: 0, fat: 0, estimatedByAI: false });
    } finally {
      setEstimating(false);
    }
  };

  const addDraftToList = () => {
    if (!draft) return;
    const next = [...items, draft];
    setItems(next);
    setDraft(null);
    setFoodDesc("");
    persist(next, water);
    toast.success("Öğün eklendi ve kaydedildi.");
  };

  const removeItem = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    persist(next, water);
  };

  const saveWater = () => persist(items, water);

  const totals = totalsOf(items);

  return (
    <UserPageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Beslenme Takibi</h1>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <p className="text-sm text-muted-foreground">
          Ne yediğini yaz, kalorisini senin için tahmin edelim. Her öğün eklendiğinde otomatik kaydedilir.
        </p>

        <div className="rounded-2xl border bg-card p-5 space-y-5">
          <div>
            <label className="text-sm font-medium">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={e => changeDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {calorieTarget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Günlük Hedef</span>
                <span className="text-muted-foreground">{totals.calories} / {calorieTarget} kcal</span>
              </div>
              <Progress value={Math.min(100, (totals.calories / calorieTarget) * 100)} />
            </div>
          )}

          {/* Eklenen öğünler */}
          {items.length > 0 && (
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="truncate">{it.description}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{it.calories} kcal</span>
                    <button type="button" onClick={() => removeItem(i)} className="text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Öğün ekleme mini-formu */}
          <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
            <label className="text-sm font-medium">Ne yedin?</label>
            <div className="flex gap-2">
              <input
                placeholder="örn. 1 tabak mercimek çorbası + 2 dilim ekmek"
                value={foodDesc}
                onChange={e => { setFoodDesc(e.target.value); setDraft(null); }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="button" variant="secondary" onClick={estimate} disabled={!foodDesc.trim() || estimating} className="gap-1.5 shrink-0">
                {estimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Tahmin Et
              </Button>
            </div>

            {draft && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  {draft.estimatedByAI ? "AI tahmini — istersen düzelt:" : "Değerleri elle gir:"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" min="0" placeholder="kcal" value={draft.calories || ""} onChange={e => setDraft({ ...draft, calories: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="protein g" value={draft.protein || ""} onChange={e => setDraft({ ...draft, protein: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="karb g" value={draft.carbs || ""} onChange={e => setDraft({ ...draft, carbs: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="yağ g" value={draft.fat || ""} onChange={e => setDraft({ ...draft, fat: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                </div>
                <Button type="button" onClick={addDraftToList} className="w-full" size="sm">
                  Listeye Ekle
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Su (ml, isteğe bağlı)</label>
            <div className="mt-1 flex gap-2">
              <input type="number" min="0" value={water} onChange={e => setWater(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <Button type="button" variant="outline" onClick={saveWater} disabled={saving}>Kaydet</Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
              <span>Toplam: {totals.calories} kcal</span>
              <span>{totals.protein}g protein</span>
              <span>{totals.carbs}g karbonhidrat</span>
              <span>{totals.fat}g yağ</span>
            </div>
          )}
        </div>

        {/* History */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : history.filter(l => l.date !== date).length === 0 ? (
          items.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-4xl">🍽️</p>
              <p className="font-semibold">Henüz beslenme kaydı yok</p>
              <p className="text-sm text-muted-foreground">İlk öğününü ekle.</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Geçmiş</h2>
            {history.filter(l => l.date !== date).map(l => <NutritionLogCard key={l._id} log={l} />)}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
