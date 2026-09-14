"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, X, Loader2 } from "lucide-react";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

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
  const t = useTranslations("nutrition");
  const locale = useLocale();
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{new Date(log.date).toLocaleDateString(LOCALE_TAG[locale] || "tr-TR")}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {log.calories != null && <span>{t("caloriesUnit", { value: log.calories })}</span>}
        {log.protein != null && <span>{t("proteinUnit", { value: log.protein })}</span>}
        {log.carbs != null && <span>{t("carbsUnit", { value: log.carbs })}</span>}
        {log.fat != null && <span>{t("fatUnit", { value: log.fat })}</span>}
        {log.water != null && <span>{t("waterUnit", { value: log.water })}</span>}
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

interface CoachNutritionPlan {
  dailyCalorieTarget?: number | null;
  macroTargets?: { protein?: number | null; carbs?: number | null; fat?: number | null };
  tips?: string[];
  meals?: { name?: string; description?: string; time?: string }[];
}

export default function NutritionLogPage() {
  const t = useTranslations("nutrition");
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [coachPlan, setCoachPlan] = useState<CoachNutritionPlan | null>(null);
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
          const plan = (progData?.program || progData)?.nutritionPlan;
          if (plan) setCoachPlan(plan);
          if (typeof plan?.dailyCalorieTarget === "number") setCalorieTarget(plan.dailyCalorieTarget);
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
      toast.error(t("saveError"));
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
      toast.error(t("estimateError"));
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
    toast.success(t("mealAdded"));
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
          <h1 className="text-2xl font-bold">{t("heading")}</h1>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("intro")}
        </p>

        <div className="rounded-2xl border bg-card p-5 space-y-5">
          <div>
            <label className="text-sm font-medium">{t("dateLabel")}</label>
            <input
              type="date"
              value={date}
              onChange={e => changeDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {coachPlan && (coachPlan.dailyCalorieTarget || coachPlan.macroTargets?.protein || coachPlan.macroTargets?.carbs || coachPlan.macroTargets?.fat || coachPlan.tips?.length || coachPlan.meals?.length) ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-semibold">{t("coachTargetsTitle")}</p>

              {calorieTarget && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calorieLabel")}</span>
                    <span className="font-medium">{totals.calories} / {calorieTarget} kcal</span>
                  </div>
                  <Progress value={Math.min(100, (totals.calories / calorieTarget) * 100)} />
                </div>
              )}

              {(coachPlan.macroTargets?.protein != null || coachPlan.macroTargets?.carbs != null || coachPlan.macroTargets?.fat != null) && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {coachPlan.macroTargets?.protein != null && (
                    <div className="rounded-lg bg-background border border-border py-2">
                      <p className="text-base font-bold tabular-nums">{coachPlan.macroTargets.protein}g</p>
                      <p className="text-[11px] text-muted-foreground">{t("protein")}</p>
                    </div>
                  )}
                  {coachPlan.macroTargets?.carbs != null && (
                    <div className="rounded-lg bg-background border border-border py-2">
                      <p className="text-base font-bold tabular-nums">{coachPlan.macroTargets.carbs}g</p>
                      <p className="text-[11px] text-muted-foreground">{t("carbs")}</p>
                    </div>
                  )}
                  {coachPlan.macroTargets?.fat != null && (
                    <div className="rounded-lg bg-background border border-border py-2">
                      <p className="text-base font-bold tabular-nums">{coachPlan.macroTargets.fat}g</p>
                      <p className="text-[11px] text-muted-foreground">{t("fat")}</p>
                    </div>
                  )}
                </div>
              )}

              {coachPlan.tips && coachPlan.tips.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("tipsLabel")}</p>
                  <ul className="text-sm list-disc list-inside space-y-0.5">
                    {coachPlan.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              )}

              {coachPlan.meals && coachPlan.meals.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("suggestedMealsLabel")}</p>
                  <ul className="text-sm divide-y divide-border">
                    {coachPlan.meals.map((m, i) => (
                      <li key={i} className="py-1.5 flex items-center justify-between gap-2">
                        <span>
                          <span className="font-medium">{m.name || t("mealFallback")}</span>
                          {m.description && <span className="text-muted-foreground"> — {m.description}</span>}
                        </span>
                        {m.time && <span className="text-xs text-muted-foreground shrink-0">{m.time}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

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
            <label className="text-sm font-medium">{t("whatDidYouEat")}</label>
            <div className="flex gap-2">
              <input
                placeholder={t("foodPlaceholder")}
                value={foodDesc}
                onChange={e => { setFoodDesc(e.target.value); setDraft(null); }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="button" variant="secondary" onClick={estimate} disabled={!foodDesc.trim() || estimating} className="gap-1.5 shrink-0">
                {estimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t("estimate")}
              </Button>
            </div>

            {draft && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  {draft.estimatedByAI ? t("aiEstimateHint") : t("manualEntryHint")}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" min="0" placeholder="kcal" value={draft.calories || ""} onChange={e => setDraft({ ...draft, calories: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="protein g" value={draft.protein || ""} onChange={e => setDraft({ ...draft, protein: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="karb g" value={draft.carbs || ""} onChange={e => setDraft({ ...draft, carbs: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min="0" placeholder="yağ g" value={draft.fat || ""} onChange={e => setDraft({ ...draft, fat: Number(e.target.value) || 0 })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                </div>
                <Button type="button" onClick={addDraftToList} className="w-full" size="sm">
                  {t("addToList")}
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">{t("waterLabel")}</label>
            <div className="mt-1 flex gap-2">
              <input type="number" min="0" value={water} onChange={e => setWater(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <Button type="button" variant="outline" onClick={saveWater} disabled={saving}>{t("save")}</Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
              <span>{t("totalLabel", { calories: totals.calories })}</span>
              <span>{t("totalProtein", { value: totals.protein })}</span>
              <span>{t("totalCarbs", { value: totals.carbs })}</span>
              <span>{t("totalFat", { value: totals.fat })}</span>
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
              <p className="font-semibold">{t("emptyTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("emptyDesc")}</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("historyTitle")}</h2>
            {history.filter(l => l.date !== date).map(l => <NutritionLogCard key={l._id} log={l} />)}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
