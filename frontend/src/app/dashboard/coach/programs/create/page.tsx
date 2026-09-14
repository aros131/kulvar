"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import CoachPageShell from "@/components/coach/CoachPageShell";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DailyScheduleForm from "@/components/program/DailyScheduleForm";
import type { DailyEntry } from "@/components/program/DailyScheduleForm";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// Values sent to the backend/AI stay in Turkish (matches how difficulty/goal
// strings are stored and matched elsewhere in the app) — only the displayed
// labels are translated.
const DIFFICULTY_VALUES = ["Başlangıç", "Orta Düzey", "İleri Seviye"] as const;
const GOAL_VALUES = ["Kilo Kaybı", "Kas Kazanımı", "Dayanıklılık", "Genel Fitness", "Genel Fitness ve Güç Geliştirme", "Hedefe Özel Gelişim"] as const;
const AI_GOAL_VALUES = ["Kas Kazanımı", "Kilo Kaybı", "Dayanıklılık", "Genel Fitness"] as const;
const AI_LEVEL_VALUES = ["Başlangıç", "Orta Düzey", "İleri Seviye"] as const;
const AI_EQUIPMENT_VALUES = ["Spor salonu", "Ev (ekipmansız)", "Dambıl ve bant"] as const;

export default function CreateProgramPage() {
  const t = useTranslations("programCreate");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTemplateMode = searchParams.get("mode") === "template";

  const difficultyLabels: Record<string, string> = {
    "Başlangıç": t("difficultyBeginner"),
    "Orta Düzey": t("difficultyIntermediate"),
    "İleri Seviye": t("difficultyAdvanced"),
  };
  const goalLabels: Record<string, string> = {
    "Kilo Kaybı": t("goalWeightLoss"),
    "Kas Kazanımı": t("goalMuscleGain"),
    "Dayanıklılık": t("goalEndurance"),
    "Genel Fitness": t("goalGeneralFitness"),
    "Genel Fitness ve Güç Geliştirme": t("goalGeneralFitnessStrength"),
    "Hedefe Özel Gelişim": t("goalCustom"),
  };
  const equipmentLabels: Record<string, string> = {
    "Spor salonu": t("equipmentGym"),
    "Ev (ekipmansız)": t("equipmentHome"),
    "Dambıl ve bant": t("equipmentDumbbellBand"),
  };

  const [form, setForm] = useState({
    name: "", description: "", duration: 4,
    difficulty: "Başlangıç", fitnessGoal: "Genel Fitness",
    priceCents: null as number | null,
  });
  const [dailySchedule, setDailySchedule] = useState<DailyEntry[]>([]);

  // AI Program Generator
  const [showAI, setShowAI] = useState(false);
  const [aiParams, setAiParams] = useState({
    goal: "Kas Kazanımı", level: "Orta Düzey", daysPerWeek: "4",
    equipment: "Spor salonu", age: "", gender: "", notes: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [scheduleKey, setScheduleKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    setAiPreview(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/ai/generate-program`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...aiParams, daysPerWeek: Number(aiParams.daysPerWeek) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAiPreview(data.program);
    } catch (err: any) {
      toast.error(t("aiError", { error: err.message }));
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIProgram = () => {
    if (!aiPreview) return;
    // Form bilgilerini doldur
    setForm(prev => ({
      ...prev,
      name: aiPreview.programAdi || prev.name,
      description: aiPreview.aciklama || prev.description,
    }));
    // Günleri DailyScheduleForm formatına çevir
    const days: DailyEntry[] = (aiPreview.gunler || []).map((g: any) => ({
      day: g.gun,
      notes: "",
      sessions: [{
        name: g.seansAdi || t("sessionFallback"),
        exercises: (g.egzersizler || []).map((ex: any) => ({
          name: ex.ad,
          type: ex.tip || "strength",
          sets: ex.set ?? 3,
          reps: ex.tekrar ?? 10,
          weight: null,
          restTime: ex.dinlenme ?? 60,
          videoUrls: [],
        })),
      }],
    }));
    setDailySchedule(days);
    setScheduleKey(k => k + 1);
    setShowAI(false);
    toast.success(t("aiApplied"));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API}/programs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...form, dailySchedule, isTemplate: isTemplateMode }),
      });
      if (res.ok) {
        toast.success(isTemplateMode ? t("templateCreated") : t("programCreated"));
        router.push(isTemplateMode ? "/dashboard/coach/templates" : "/dashboard/coach/programs");
      } else {
        const err = await res.json();
        toast.error(t("createError", { error: err.message }));
      }
    } catch {
      toast.error(t("genericError"));
    }
  };

  return (
    <CoachPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{isTemplateMode ? t("newTemplateTitle") : t("newProgramTitle")}</h1>
          <Button variant="outline" className="gap-2 border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            onClick={() => setShowAI(v => !v)}>
            <Sparkles className="w-4 h-4" />
            {t("aiCreateButton")}
            {showAI ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* AI Program Generator */}
        {showAI && (
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {t("aiGeneratorTitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("aiGoalLabel")}</Label>
                <select value={aiParams.goal} onChange={e => setAiParams(p => ({ ...p, goal: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {AI_GOAL_VALUES.map(v => <option key={v} value={v}>{goalLabels[v] || v}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t("aiLevelLabel")}</Label>
                <select value={aiParams.level} onChange={e => setAiParams(p => ({ ...p, level: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {AI_LEVEL_VALUES.map(v => <option key={v} value={v}>{difficultyLabels[v] || v}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t("aiDaysPerWeekLabel")}</Label>
                <input type="number" min={1} max={7} value={aiParams.daysPerWeek}
                  onChange={e => setAiParams(p => ({ ...p, daysPerWeek: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{t("aiEquipmentLabel")}</Label>
                <select value={aiParams.equipment} onChange={e => setAiParams(p => ({ ...p, equipment: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {AI_EQUIPMENT_VALUES.map(v => <option key={v} value={v}>{equipmentLabels[v] || v}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">{t("aiAgeLabel")}</Label>
                <input type="number" value={aiParams.age} onChange={e => setAiParams(p => ({ ...p, age: e.target.value }))}
                  placeholder={t("aiAgePlaceholder")}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{t("aiGenderLabel")}</Label>
                <select value={aiParams.gender} onChange={e => setAiParams(p => ({ ...p, gender: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">{t("aiGenderUnset")}</option>
                  <option value="Erkek">{t("aiGenderMale")}</option>
                  <option value="Kadın">{t("aiGenderFemale")}</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("aiNotesLabel")}</Label>
              <input type="text" value={aiParams.notes} onChange={e => setAiParams(p => ({ ...p, notes: e.target.value }))}
                placeholder={t("aiNotesPlaceholder")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <Button onClick={generateWithAI} disabled={aiLoading} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("aiGenerating")}</> : <><Sparkles className="w-4 h-4" /> {t("aiGenerateBtn")}</>}
            </Button>

            {/* AI Preview */}
            {aiPreview && (
              <div className="mt-3 space-y-3 border-t border-violet-200 dark:border-violet-700 pt-3">
                <p className="font-semibold text-sm">{aiPreview.programAdi}</p>
                <p className="text-xs text-muted-foreground">{aiPreview.aciklama}</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(aiPreview.gunler || []).map((g: any, i: number) => (
                    <div key={i} className="text-xs bg-white dark:bg-black/20 rounded-lg p-2">
                      <p className="font-semibold">{g.gun} — {g.seansAdi}</p>
                      <p className="text-muted-foreground">{(g.egzersizler || []).map((e: any) => e.ad).join(', ')}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={applyAIProgram} className="w-full gap-2" variant="outline">
                  {t("aiPreviewApply")}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("programNameLabel")}</Label>
          <Input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>{t("descriptionLabel")}</Label>
          <Textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>{t("durationLabel")}</Label>
          <Input type="number" name="duration" value={form.duration} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>{t("difficultyLabel")}</Label>
          <Select value={form.difficulty} onValueChange={(v) => setForm(p => ({ ...p, difficulty: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIFFICULTY_VALUES.map(v => <SelectItem key={v} value={v}>{difficultyLabels[v]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("goalLabel")}</Label>
          <Select value={form.fitnessGoal} onValueChange={(v) => setForm(p => ({ ...p, fitnessGoal: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOAL_VALUES.map(v => <SelectItem key={v} value={v}>{goalLabels[v]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {!isTemplateMode && (
          <div>
            <Label>{t("priceLabel")}</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
              <Input className="pl-7" type="number" min={0} step={1} placeholder={t("pricePlaceholder")}
                value={form.priceCents != null ? form.priceCents / 100 : ""}
                onChange={(e) => setForm(p => ({ ...p, priceCents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) }))} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("weeklyProgramLabel")}</Label>
          <DailyScheduleForm key={scheduleKey} onChange={(data) => setDailySchedule(data)} initial={{ dailySchedule }} />
        </div>

        <Button onClick={handleSubmit} className="w-full">{isTemplateMode ? t("createTemplateBtn") : t("createProgramBtn")}</Button>
      </div>
    </CoachPageShell>
  );
}
