// src/components/coach/EditProgramForm.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Program } from "@/types/program";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Check, ChevronRight, Trash2, FileText } from "lucide-react";
import ProgramMediaSection from "@/components/coach/ProgramMediaSection";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface LibraryExercise { _id: string; name: string; nameTR?: string; bodyPartTR?: string; targetTR?: string; gifUrl?: string; }

function ExerciseSearchInput({ value, onChange, onSelect, t }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (ex: LibraryExercise) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<LibraryExercise[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = (q: string) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await fetch(`${API_URL}/exercises?q=${encodeURIComponent(q)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults(Array.isArray(data.exercises) ? data.exercises : []);
      } catch { setResults([]); }
    }, 300);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={t("exerciseSearchPlaceholder")}
        onChange={(e) => { onChange(e.target.value); setOpen(true); search(e.target.value); }}
        onFocus={() => { setOpen(true); search(value); }}
        onBlur={() => { closeTimer.current = setTimeout(() => setOpen(false), 200); }}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-popover border border-border rounded-md shadow-lg py-1 max-h-64 overflow-y-auto">
          {results.map((ex) => (
            <li key={ex._id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearTimeout(closeTimer.current);
                  onSelect(ex);
                  setOpen(false);
                  setResults([]);
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
              >
                {ex.gifUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ex.gifUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-muted" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center text-lg">💪</div>
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground">{[ex.bodyPartTR, ex.targetTR].filter(Boolean).join(' · ')}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface EditProgramFormProps {
  program: Program;
  mode: "edit" | "create";
  onSuccess?: () => void;
}

// Helper types for nested structures (keeps TS happy even if Program is looser/stricter)
interface DSVideoUrl { url?: string; description?: string }
interface DSExercise { name?: string; sets?: number; reps?: number; duration?: string; restTime?: number; videoUrls?: DSVideoUrl[]; gifUrl?: string; }
interface DSSession { name?: string; exercises?: DSExercise[] }
interface DSDay { day?: string; sessions?: DSSession[]; notes?: string }
interface StandaloneExercise { name?: string; sets?: number; reps?: number; duration?: string; videoUrls?: DSVideoUrl[] }
interface MediaItem { name?: string; url?: string; description?: string }
interface Meal { name?: string; description?: string; time?: string }
interface Announcement { message?: string; date?: string | Date }

export default function EditProgramForm({ program: initialProgram, mode, onSuccess }: EditProgramFormProps) {
  const t = useTranslations("editProgramForm");
  const tp = useTranslations("programCreate");
  const DIFFICULTY_VALUES = ["Başlangıç", "Orta Düzey", "İleri Seviye"] as const;
  const GOAL_VALUES = ["Kilo Kaybı", "Kas Kazanımı", "Dayanıklılık", "Genel Fitness", "Genel Fitness ve Güç Geliştirme", "Hedefe Özel Gelişim"] as const;
  const STATUS_VALUES = ["Aktif", "Tamamlandı", "Durduruldu"] as const;
  const difficultyLabels: Record<string, string> = {
    "Başlangıç": tp("difficultyBeginner"),
    "Orta Düzey": tp("difficultyIntermediate"),
    "İleri Seviye": tp("difficultyAdvanced"),
  };
  const goalLabels: Record<string, string> = {
    "Kilo Kaybı": tp("goalWeightLoss"),
    "Kas Kazanımı": tp("goalMuscleGain"),
    "Dayanıklılık": tp("goalEndurance"),
    "Genel Fitness": tp("goalGeneralFitness"),
    "Genel Fitness ve Güç Geliştirme": tp("goalGeneralFitnessStrength"),
    "Hedefe Özel Gelişim": tp("goalCustom"),
  };
  const statusLabels: Record<string, string> = {
    "Aktif": t("statusActive"),
    "Tamamlandı": t("statusCompleted"),
    "Durduruldu": t("statusPaused"),
  };
  // Normalize incoming data so UI never crashes on undefined
  const normalized = useMemo(() => {
    const p: any = { ...initialProgram };
    p.dailySchedule = Array.isArray(p.dailySchedule) ? p.dailySchedule : [];
    p.exercises = Array.isArray(p.exercises) ? p.exercises : [];
    p.nutritionPlan = p.nutritionPlan || {};
    p.nutritionPlan.tips = Array.isArray(p.nutritionPlan.tips) ? p.nutritionPlan.tips : [];
    p.nutritionPlan.meals = Array.isArray(p.nutritionPlan.meals) ? p.nutritionPlan.meals : [];
    p.videos = Array.isArray(p.videos) ? p.videos : [];
    p.pdfs = Array.isArray(p.pdfs) ? p.pdfs : [];
    p.announcements = Array.isArray(p.announcements) ? p.announcements : [];
    return p as Program;
  }, [initialProgram]);

  const [program, setProgram] = useState<Program>(normalized);
  const API_BASE = API_URL;

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const skipFirstDirtyCheck = useRef(true);
  useEffect(() => {
    if (skipFirstDirtyCheck.current) { skipFirstDirtyCheck.current = false; return; }
    setIsDirty(true);
    setJustSaved(false);
  }, [program]);

  // -------------------------------
  // Generic handlers
  // -------------------------------
  const simpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProgram((prev: any) => ({ ...prev, [name]: name === "duration" ? Number(value) : value }));
  };

  // -------------------------------
  // Daily Schedule helpers
  // -------------------------------
  // Programs are stored as a flat list of days (Pazartesi..Pazar repeated per week).
  // Group every 7 into a "week" so the coach can jump straight to e.g. week 4
  // instead of scrolling past every earlier day, and collapse each day by
  // default so a week's worth of days fits on screen at a glance.
  const dailySchedule: DSDay[] = Array.isArray((program as any).dailySchedule) ? (program as any).dailySchedule : [];
  const weeks: { day: DSDay; globalIdx: number }[][] = [];
  for (let i = 0; i < dailySchedule.length; i += 7) {
    weeks.push(dailySchedule.slice(i, i + 7).map((day, j) => ({ day, globalIdx: i + j })));
  }
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const toggleDayExpanded = (idx: number) => setExpandedDays((prev) => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });

  const addDay = () => {
    setProgram((prev: any) => ({
      ...prev,
      dailySchedule: [
        ...prev.dailySchedule,
        { day: "Pazartesi", notes: "", sessions: [{ name: t("defaultSessionName"), exercises: [defaultExercise()] }] },
      ],
    }));
  };

  const handleAddDay = () => {
    const newIdx = dailySchedule.length;
    addDay();
    setSelectedWeek(Math.floor(newIdx / 7));
    setExpandedDays((prev) => new Set(prev).add(newIdx));
  };

  const removeDay = (dIdx: number) => {
    setProgram((prev: any) => ({
      ...prev,
      dailySchedule: prev.dailySchedule.filter((_: any, i: number) => i !== dIdx),
    }));
    setExpandedDays(new Set());
  };

  const updateDayField = (dIdx: number, field: keyof DSDay, value: any) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      ds[dIdx] = { ...ds[dIdx], [field]: value };
      return { ...prev, dailySchedule: ds };
    });
  };

  const addSession = (dIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = Array.isArray(ds[dIdx]?.sessions) ? [...ds[dIdx].sessions] : [];
      sessions.push({ name: t("sessionFallback", { n: sessions.length + 1 }), exercises: [defaultExercise()] });
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const removeSession = (dIdx: number, sIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      sessions.splice(sIdx, 1);
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const updateSessionName = (dIdx: number, sIdx: number, name: string) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const s = { ...(sessions[sIdx] || {}) };
      s.name = name;
      sessions[sIdx] = s;
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const defaultExercise = (): DSExercise => ({ name: t("defaultExerciseName"), sets: 0, reps: 0, duration: t("defaultDurationText"), restTime: 0, videoUrls: [] });

  const addExerciseToSession = (dIdx: number, sIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = Array.isArray(sessions[sIdx]?.exercises) ? [...sessions[sIdx].exercises] : [];
      exs.push(defaultExercise());
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const removeExerciseFromSession = (dIdx: number, sIdx: number, eIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = [...(sessions[sIdx]?.exercises || [])];
      exs.splice(eIdx, 1);
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const updateExerciseField = (dIdx: number, sIdx: number, eIdx: number, field: keyof DSExercise, value: any) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = [...(sessions[sIdx]?.exercises || [])];
      const ex = { ...(exs[eIdx] || {}) } as any;
      ex[field] = field === "sets" || field === "reps" || field === "restTime" ? Number(value) : value;
      exs[eIdx] = ex;
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const addVideoUrlToExercise = (dIdx: number, sIdx: number, eIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = [...(sessions[sIdx]?.exercises || [])];
      const ex = { ...(exs[eIdx] || {}) } as any;
      const list = Array.isArray(ex.videoUrls) ? [...ex.videoUrls] : [];
      list.push({ url: "", description: "" });
      ex.videoUrls = list;
      exs[eIdx] = ex;
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const updateVideoUrl = (
    dIdx: number,
    sIdx: number,
    eIdx: number,
    vIdx: number,
    field: keyof DSVideoUrl,
    value: string
  ) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = [...(sessions[sIdx]?.exercises || [])];
      const ex = { ...(exs[eIdx] || {}) } as any;
      const list = Array.isArray(ex.videoUrls) ? [...ex.videoUrls] : [];
      const v = { ...(list[vIdx] || {}) } as any;
      v[field] = value;
      list[vIdx] = v;
      ex.videoUrls = list;
      exs[eIdx] = ex;
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  const removeVideoUrl = (dIdx: number, sIdx: number, eIdx: number, vIdx: number) => {
    setProgram((prev: any) => {
      const ds = [...prev.dailySchedule];
      const sessions = [...(ds[dIdx]?.sessions || [])];
      const exs = [...(sessions[sIdx]?.exercises || [])];
      const ex = { ...(exs[eIdx] || {}) } as any;
      ex.videoUrls = (ex.videoUrls || []).filter((_: any, i: number) => i !== vIdx);
      exs[eIdx] = ex;
      sessions[sIdx] = { ...(sessions[sIdx] || {}), exercises: exs };
      ds[dIdx] = { ...ds[dIdx], sessions };
      return { ...prev, dailySchedule: ds };
    });
  };

  // -------------------------------
  // Standalone Exercises
  // -------------------------------
  const addStandaloneExercise = () => {
    setProgram((prev: any) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name: t("defaultExerciseName"), sets: 0, reps: 0, duration: t("defaultDurationText"), videoUrls: [] },
      ],
    }));
  };

  const updateStandaloneExercise = (idx: number, field: keyof StandaloneExercise, value: any) => {
    setProgram((prev: any) => {
      const exs = [...prev.exercises];
      const ex = { ...(exs[idx] || {}) } as any;
      ex[field] = field === "sets" || field === "reps" ? Number(value) : value;
      exs[idx] = ex;
      return { ...prev, exercises: exs };
    });
  };

  const removeStandaloneExercise = (idx: number) => {
    setProgram((prev: any) => ({ ...prev, exercises: prev.exercises.filter((_: any, i: number) => i !== idx) }));
  };

  const addStandaloneVideo = (idx: number) => {
    setProgram((prev: any) => {
      const exs = [...prev.exercises];
      const ex = { ...(exs[idx] || {}) } as any;
      const list = Array.isArray(ex.videoUrls) ? [...ex.videoUrls] : [];
      list.push({ url: "", description: "" });
      ex.videoUrls = list;
      exs[idx] = ex;
      return { ...prev, exercises: exs };
    });
  };

  const updateStandaloneVideo = (eIdx: number, vIdx: number, field: keyof DSVideoUrl, value: string) => {
    setProgram((prev: any) => {
      const exs = [...prev.exercises];
      const ex = { ...(exs[eIdx] || {}) } as any;
      const list = Array.isArray(ex.videoUrls) ? [...ex.videoUrls] : [];
      const v = { ...(list[vIdx] || {}) } as any;
      v[field] = value;
      list[vIdx] = v;
      ex.videoUrls = list;
      exs[eIdx] = ex;
      return { ...prev, exercises: exs };
    });
  };

  const removeStandaloneVideo = (eIdx: number, vIdx: number) => {
    setProgram((prev: any) => {
      const exs = [...prev.exercises];
      const ex = { ...(exs[eIdx] || {}) } as any;
      ex.videoUrls = (ex.videoUrls || []).filter((_: any, i: number) => i !== vIdx);
      exs[eIdx] = ex;
      return { ...prev, exercises: exs };
    });
  };

  // -------------------------------
  // Nutrition Plan
  // -------------------------------
  const addTip = () => setProgram((prev: any) => ({ ...prev, nutritionPlan: { ...prev.nutritionPlan, tips: [...prev.nutritionPlan.tips, ""] } }));
  const updateTip = (idx: number, v: string) => setProgram((prev: any) => {
    const tips = [...prev.nutritionPlan.tips];
    tips[idx] = v;
    return { ...prev, nutritionPlan: { ...prev.nutritionPlan, tips } };
  });
  const removeTip = (idx: number) => setProgram((prev: any) => ({ ...prev, nutritionPlan: { ...prev.nutritionPlan, tips: prev.nutritionPlan.tips.filter((_: string, i: number) => i !== idx) } }));

  const addMeal = () => setProgram((prev: any) => ({ ...prev, nutritionPlan: { ...prev.nutritionPlan, meals: [...prev.nutritionPlan.meals, { name: "", description: "", time: "" }] } }));
  const updateMeal = (idx: number, field: keyof Meal, value: string) => setProgram((prev: any) => {
    const meals = [...prev.nutritionPlan.meals];
    const m = { ...(meals[idx] || {}) } as any;
    m[field] = value;
    meals[idx] = m;
    return { ...prev, nutritionPlan: { ...prev.nutritionPlan, meals } };
  });
  const removeMeal = (idx: number) => setProgram((prev: any) => ({ ...prev, nutritionPlan: { ...prev.nutritionPlan, meals: prev.nutritionPlan.meals.filter((_: Meal, i: number) => i !== idx) } }));

  // Beslenme planı PDF'inden öğün/hedef çıkarımı — elle tek tek girmek yerine
  // koçun elindeki hazır planı yükleyip otomatik doldurmasını sağlar.
  const [extractingPdf, setExtractingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const handlePdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(t("pdfOnlyError"));
      return;
    }

    setExtractingPdf(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/ai/extract-meals-from-pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("pdfProcessError"));

      const plan = data.plan as {
        meals: { name: string; description: string; time: string }[];
        dailyCalorieTarget: number | null;
        macroTargets: { protein: number | null; carbs: number | null; fat: number | null };
        tips: string[];
      };

      setProgram((prev: any) => {
        const existingMeals = Array.isArray(prev.nutritionPlan?.meals) ? prev.nutritionPlan.meals : [];
        const existingTips: string[] = Array.isArray(prev.nutritionPlan?.tips) ? prev.nutritionPlan.tips : [];
        const newTips = plan.tips.filter((t) => !existingTips.includes(t));
        return {
          ...prev,
          nutritionPlan: {
            ...prev.nutritionPlan,
            meals: [...existingMeals, ...plan.meals],
            tips: [...existingTips, ...newTips],
            dailyCalorieTarget: prev.nutritionPlan?.dailyCalorieTarget ?? plan.dailyCalorieTarget,
            macroTargets: {
              protein: prev.nutritionPlan?.macroTargets?.protein ?? plan.macroTargets.protein,
              carbs: prev.nutritionPlan?.macroTargets?.carbs ?? plan.macroTargets.carbs,
              fat: prev.nutritionPlan?.macroTargets?.fat ?? plan.macroTargets.fat,
            },
          },
        };
      });

      if (plan.meals.length === 0) {
        toast.warning(t("pdfNoMealsWarning"));
      } else {
        toast.success(t("pdfMealsExtracted", { count: plan.meals.length }));
      }
    } catch (err: any) {
      toast.error(err?.message || t("pdfProcessError"));
    } finally {
      setExtractingPdf(false);
    }
  };

  // -------------------------------
  // Legacy Videos & PDFs
  // -------------------------------
  const addLegacy = (key: "videos" | "pdfs") => setProgram((prev: any) => ({ ...prev, [key]: [...prev[key], { name: "", url: "", description: "" }] }));
  const updateLegacy = (key: "videos" | "pdfs", idx: number, field: keyof MediaItem, value: string) => setProgram((prev: any) => {
    const list = [...prev[key]];
    const it = { ...(list[idx] || {}) } as any;
    (it as any)[field] = value;
    list[idx] = it;
    return { ...prev, [key]: list };
  });
  const removeLegacy = (key: "videos" | "pdfs", idx: number) => setProgram((prev: any) => ({ ...prev, [key]: prev[key].filter((_: MediaItem, i: number) => i !== idx) }));

  // -------------------------------
  // Announcements
  // -------------------------------
  const addAnnouncement = () => setProgram((prev: any) => ({ ...prev, announcements: [...prev.announcements, { message: "", date: new Date().toISOString() }] }));
  const updateAnnouncement = (idx: number, field: keyof Announcement, value: string) => setProgram((prev: any) => {
    const list = [...prev.announcements];
    const it = { ...(list[idx] || {}) } as any;
    (it as any)[field] = value;
    list[idx] = it;
    return { ...prev, announcements: list };
  });
  const removeAnnouncement = (idx: number) => setProgram((prev: any) => ({ ...prev, announcements: prev.announcements.filter((_: Announcement, i: number) => i !== idx) }));

  // -------------------------------
  // Save
  // -------------------------------
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const method = mode === "edit" ? "PUT" : "POST";
    const url = mode === "edit" ? `${API_BASE}/programs/${(program as any)._id}` : `${API_BASE}/programs`;

    // Ensure numeric types
    const payload: any = {
      ...program,
      duration: Number((program as any).duration || 0),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.success(mode === "edit" ? t("programUpdated") : t("programCreatedMsg"));
      setIsDirty(false);
      setJustSaved(true);
      onSuccess?.();
    } catch (err: any) {
      console.error("Kaydetme hatası:", err);
      toast.error(t("saveFailed", { error: err?.message || t("unknownError") }));
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <>
    <div className="space-y-8">
      {/* Core fields */}
      <section className="grid gap-4">
        <div>
          <Label htmlFor="name">{t("programNameLabel")}</Label>
          <Input name="name" value={(program as any).name || ""} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
          <Textarea name="description" value={(program as any).description || ""} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="duration">{t("durationLabel")}</Label>
          <Input name="duration" type="number" value={(program as any).duration ?? 0} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="difficulty">{t("difficultyLabel")}</Label>
          <select
            name="difficulty"
            value={(program as any).difficulty || "Başlangıç"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            {DIFFICULTY_VALUES.map((v) => <option key={v} value={v}>{difficultyLabels[v]}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="fitnessGoal">{t("goalLabel")}</Label>
          <select
            name="fitnessGoal"
            value={(program as any).fitnessGoal || "Genel Fitness"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            {GOAL_VALUES.map((v) => <option key={v} value={v}>{goalLabels[v]}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="status">{t("statusLabel")}</Label>
          <select
            name="status"
            value={(program as any).status || "Aktif"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            {STATUS_VALUES.map((v) => <option key={v} value={v}>{statusLabels[v]}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="priceCents">{t("priceLabel")}</Label>
          <Input
            id="priceCents"
            type="number"
            min="0"
            step="1"
            placeholder={t("pricePlaceholder")}
            value={(program as any).priceCents != null ? (program as any).priceCents / 100 : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100);
              setProgram((prev: any) => ({ ...prev, priceCents: val }));
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">{t("priceHint")}</p>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("dailyScheduleTitle")}</h2>
          <Button type="button" onClick={handleAddDay}>{t("addDay")}</Button>
        </div>

        {weeks.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {weeks.map((_, wIdx) => (
              <button
                key={wIdx}
                type="button"
                onClick={() => setSelectedWeek(wIdx)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedWeek === wIdx
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("weekTab", { n: wIdx + 1 })}
              </button>
            ))}
          </div>
        )}

        {(weeks[selectedWeek] || []).map(({ day, globalIdx: dIdx }) => {
          const isOpen = expandedDays.has(dIdx);
          const sessionCount = (day.sessions || []).length;
          const exerciseCount = (day.sessions || []).reduce((sum: number, s: DSSession) => sum + (s.exercises?.length || 0), 0);
          return (
          <div key={dIdx} className="border rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
              <button type="button" onClick={() => toggleDayExpanded(dIdx)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{day.day || t("dayFallback")}{day.notes ? ` · ${day.notes}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{t("sessionsCountLabel", { sessions: sessionCount, exercises: exerciseCount })}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => removeDay(dIdx)}
                className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={t("deleteDayAria")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {isOpen && (
            <div className="p-4 pt-0 space-y-3 border-t">
            <div className="grid gap-3 md:grid-cols-3 pt-3">
              <div>
                <Label>{t("dayLabel")}</Label>
                <Input value={day.day || ""} onChange={(e) => updateDayField(dIdx, "day", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>{t("notesLabel")}</Label>
                <Input value={day.notes || ""} onChange={(e) => updateDayField(dIdx, "notes", e.target.value)} />
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <h3 className="font-medium">{t("sessionsTitle")}</h3>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => addSession(dIdx)}>{t("addSession")}</Button>
              </div>
            </div>

            {(day.sessions || []).map((s: DSSession, sIdx: number) => (
              <div key={sIdx} className="rounded-lg border p-3 space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>{t("sessionNameLabel")}</Label>
                    <Input value={s.name || ""} onChange={(e) => updateSessionName(dIdx, sIdx, e.target.value)} />
                  </div>
                  <Button type="button" variant="secondary" onClick={() => addExerciseToSession(dIdx, sIdx)}>{t("addExercise")}</Button>
                  <Button type="button" variant="destructive" onClick={() => removeSession(dIdx, sIdx)}>{t("deleteSession")}</Button>
                </div>

                {(s.exercises || []).map((ex: DSExercise, eIdx: number) => (
                  <div key={eIdx} className="border rounded p-3 space-y-3">
                    <div className="grid md:grid-cols-5 gap-2">
                      <div>
                        <Label>{t("exerciseLabel")}</Label>
                        {ex.gifUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ex.gifUrl} alt={ex.name} className="w-12 h-12 rounded object-cover mb-1 border border-border bg-muted" />
                        )}
                        <ExerciseSearchInput
                          value={ex.name || ""}
                          onChange={(v) => updateExerciseField(dIdx, sIdx, eIdx, "name", v)}
                          onSelect={(lib) => {
                            updateExerciseField(dIdx, sIdx, eIdx, "name", lib.name);
                            updateExerciseField(dIdx, sIdx, eIdx, "gifUrl", lib.gifUrl ?? null);
                          }}
                          t={t}
                        />
                      </div>
                      <div>
                        <Label>{t("setLabel")}</Label>
                        <Input type="number" value={ex.sets ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "sets", e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("repsLabel")}</Label>
                        <Input type="number" value={ex.reps ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "reps", e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("durationFieldLabel")}</Label>
                        <Input value={ex.duration || t("defaultDurationText")} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "duration", e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("restLabel")}</Label>
                        <Input type="number" value={ex.restTime ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "restTime", e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{t("videoLinksTitle")}</h4>
                        <Button type="button" variant="secondary" onClick={() => addVideoUrlToExercise(dIdx, sIdx, eIdx)}>{t("addLink")}</Button>
                      </div>
                      <div className="space-y-2">
                        {(ex.videoUrls || []).map((v, vIdx) => (
                          <div key={vIdx} className="grid md:grid-cols-2 gap-2">
                            <Input placeholder={t("urlPlaceholder")} value={v.url || ""} onChange={(e) => updateVideoUrl(dIdx, sIdx, eIdx, vIdx, "url", e.target.value)} />
                            <div className="flex gap-2">
                              <Input placeholder={t("descriptionPlaceholder")} value={v.description || ""} onChange={(e) => updateVideoUrl(dIdx, sIdx, eIdx, vIdx, "description", e.target.value)} />
                              <Button type="button" variant="destructive" onClick={() => removeVideoUrl(dIdx, sIdx, eIdx, vIdx)}>{t("delete")}</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" variant="destructive" onClick={() => removeExerciseFromSession(dIdx, sIdx, eIdx)}>{t("deleteExercise")}</Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            </div>
            )}
          </div>
          );
        })}
      </section>

      {/* Standalone Exercises */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("standaloneExercisesTitle")}</h2>
          <Button type="button" onClick={addStandaloneExercise}>{t("addExercise")}</Button>
        </div>
        {(program as any).exercises?.map((ex: StandaloneExercise, idx: number) => (
          <div key={idx} className="border rounded p-3 space-y-2">
            <div className="grid md:grid-cols-5 gap-2">
              <div>
                <Label>{t("exerciseLabel")}</Label>
                <Input value={ex.name || ""} onChange={(e) => updateStandaloneExercise(idx, "name", e.target.value)} />
              </div>
              <div>
                <Label>{t("setLabel")}</Label>
                <Input type="number" value={ex.sets ?? 0} onChange={(e) => updateStandaloneExercise(idx, "sets", e.target.value)} />
              </div>
              <div>
                <Label>{t("repsLabel")}</Label>
                <Input type="number" value={ex.reps ?? 0} onChange={(e) => updateStandaloneExercise(idx, "reps", e.target.value)} />
              </div>
              <div>
                <Label>{t("durationFieldLabel")}</Label>
                <Input value={ex.duration || t("defaultDurationText")} onChange={(e) => updateStandaloneExercise(idx, "duration", e.target.value)} />
              </div>
              <div>
                <Label>{t("dashPlaceholder")}</Label>
                <Button type="button" variant="destructive" onClick={() => removeStandaloneExercise(idx)} className="w-full">{t("delete")}</Button>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{t("videoLinksTitle")}</h4>
                <Button type="button" variant="secondary" onClick={() => addStandaloneVideo(idx)}>{t("addLink")}</Button>
              </div>
              <div className="space-y-2">
                {(ex.videoUrls || []).map((v, vIdx) => (
                  <div key={vIdx} className="grid md:grid-cols-2 gap-2">
                    <Input placeholder={t("urlPlaceholder")} value={v.url || ""} onChange={(e) => updateStandaloneVideo(idx, vIdx, "url", e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder={t("descriptionPlaceholder")} value={v.description || ""} onChange={(e) => updateStandaloneVideo(idx, vIdx, "description", e.target.value)} />
                      <Button type="button" variant="destructive" onClick={() => removeStandaloneVideo(idx, vIdx)}>{t("delete")}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Nutrition Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("nutritionPlanTitle")}</h2>
        <div>
          <Label>{t("dailyTargetsLabel")}</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground font-normal">{t("caloriesLabel")}</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder={t("caloriesPlaceholder")}
                value={(program as any).nutritionPlan?.dailyCalorieTarget ?? ""}
                onChange={(e) => setProgram((prev: any) => ({
                  ...prev,
                  nutritionPlan: { ...prev.nutritionPlan, dailyCalorieTarget: e.target.value === "" ? null : Number(e.target.value) },
                }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-normal">{t("proteinLabel")}</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder={t("proteinPlaceholder")}
                value={(program as any).nutritionPlan?.macroTargets?.protein ?? ""}
                onChange={(e) => setProgram((prev: any) => ({
                  ...prev,
                  nutritionPlan: { ...prev.nutritionPlan, macroTargets: { ...prev.nutritionPlan?.macroTargets, protein: e.target.value === "" ? null : Number(e.target.value) } },
                }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-normal">{t("carbsLabel")}</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder={t("carbsPlaceholder")}
                value={(program as any).nutritionPlan?.macroTargets?.carbs ?? ""}
                onChange={(e) => setProgram((prev: any) => ({
                  ...prev,
                  nutritionPlan: { ...prev.nutritionPlan, macroTargets: { ...prev.nutritionPlan?.macroTargets, carbs: e.target.value === "" ? null : Number(e.target.value) } },
                }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-normal">{t("fatLabel")}</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder={t("fatPlaceholder")}
                value={(program as any).nutritionPlan?.macroTargets?.fat ?? ""}
                onChange={(e) => setProgram((prev: any) => ({
                  ...prev,
                  nutritionPlan: { ...prev.nutritionPlan, macroTargets: { ...prev.nutritionPlan?.macroTargets, fat: e.target.value === "" ? null : Number(e.target.value) } },
                }))}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t("tipsLabel")}</Label>
            <Button type="button" variant="secondary" onClick={addTip}>{t("addTip")}</Button>
          </div>
          <div className="space-y-2">
            {(program as any).nutritionPlan?.tips?.map((tip: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={tip} onChange={(e) => updateTip(i, e.target.value)} />
                <Button type="button" variant="destructive" onClick={() => removeTip(i)}>{t("delete")}</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <Label>{t("mealsLabel")}</Label>
            <div className="flex gap-2">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfSelected}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pdfInputRef.current?.click()}
                disabled={extractingPdf}
                className="gap-1.5"
              >
                {extractingPdf ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("pdfReading")}</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" /> {t("extractFromPdf")}</>
                )}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={addMeal}>{t("addMeal")}</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {t("pdfHint")}
          </p>
          <div className="space-y-2">
            {(program as any).nutritionPlan?.meals?.map((m: Meal, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-2">
                <Input placeholder={t("nameLabel")} value={m.name || ""} onChange={(e) => updateMeal(i, "name", e.target.value)} />
                <Input placeholder={t("descriptionPlaceholder")} value={m.description || ""} onChange={(e) => updateMeal(i, "description", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder={t("mealTimePlaceholder")} value={m.time || ""} onChange={(e) => updateMeal(i, "time", e.target.value)} />
                  <Button type="button" variant="destructive" onClick={() => removeMeal(i)}>{t("delete")}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media: file uploads + external links, grouped under one clear heading */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("mediaTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("mediaDesc")}
          </p>
        </div>

        {(program as any)._id ? (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">{t("uploadFileTitle")}</h3>
            <ProgramMediaSection programId={(program as any)._id} />
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-sm text-muted-foreground">
            {t("saveFirstHint")}
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t("externalVideoLinksTitle")}</h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => addLegacy("videos")}>{t("addLink")}</Button>
          </div>
          {((program as any).videos?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLinksYet")}</p>
          ) : (
            (program as any).videos?.map((v: MediaItem, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
                <Input placeholder={t("nameLabel")} value={v.name || ""} onChange={(e) => updateLegacy("videos", i, "name", e.target.value)} />
                <Input placeholder={t("urlPlaceholder")} value={v.url || ""} onChange={(e) => updateLegacy("videos", i, "url", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder={t("descriptionPlaceholder")} value={v.description || ""} onChange={(e) => updateLegacy("videos", i, "description", e.target.value)} />
                  <Button type="button" variant="destructive" onClick={() => removeLegacy("videos", i)}>{t("delete")}</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t("externalPdfLinksTitle")}</h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => addLegacy("pdfs")}>{t("addLink")}</Button>
          </div>
          {((program as any).pdfs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLinksYet")}</p>
          ) : (
            (program as any).pdfs?.map((v: MediaItem, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
                <Input placeholder={t("nameLabel")} value={v.name || ""} onChange={(e) => updateLegacy("pdfs", i, "name", e.target.value)} />
                <Input placeholder={t("urlPlaceholder")} value={v.url || ""} onChange={(e) => updateLegacy("pdfs", i, "url", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder={t("descriptionPlaceholder")} value={v.description || ""} onChange={(e) => updateLegacy("pdfs", i, "description", e.target.value)} />
                  <Button type="button" variant="destructive" onClick={() => removeLegacy("pdfs", i)}>{t("delete")}</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Announcements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("announcementsTitle")}</h2>
          <Button type="button" onClick={addAnnouncement}>{t("addAnnouncement")}</Button>
        </div>
        {(program as any).announcements?.map((a: Announcement, i: number) => (
          <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
            <Input placeholder={t("messagePlaceholder")} value={a.message || ""} onChange={(e) => updateAnnouncement(i, "message", e.target.value)} />
            <Input type="datetime-local" value={formatForDatetimeLocal(a.date)} onChange={(e) => updateAnnouncement(i, "date", e.target.value)} />
            <div className="flex items-end">
              <Button type="button" variant="destructive" onClick={() => removeAnnouncement(i)} className="w-full">{t("delete")}</Button>
            </div>
          </div>
        ))}
      </section>

    </div>

    {/* Sticky save bar — always reachable, no need to scroll to the bottom of a long form */}
    <div className="fixed bottom-14 md:bottom-0 left-0 md:left-16 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {justSaved ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> {t("saved")}
            </span>
          ) : isDirty ? (
            t("unsavedChanges")
          ) : (
            t("allSaved")
          )}
        </span>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none sm:min-w-[160px]">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("saving")}</>
          ) : mode === "edit" ? t("updateBtn") : t("createBtn")}
        </Button>
      </div>
    </div>
    </>
  );
}

function formatForDatetimeLocal(d?: string | Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}