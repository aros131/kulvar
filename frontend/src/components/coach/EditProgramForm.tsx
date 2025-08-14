// src/components/coach/EditProgramForm.tsx

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Program } from "@/types/program";

interface EditProgramFormProps {
  program: Program;
  mode: "edit" | "create";
  onSuccess?: () => void;
}

// Helper types for nested structures (keeps TS happy even if Program is looser/stricter)
interface DSVideoUrl { url?: string; description?: string }
interface DSExercise { name?: string; sets?: number; reps?: number; duration?: string; restTime?: number; videoUrls?: DSVideoUrl[] }
interface DSSession { name?: string; exercises?: DSExercise[] }
interface DSDay { day?: string; sessions?: DSSession[]; notes?: string }
interface StandaloneExercise { name?: string; sets?: number; reps?: number; duration?: string; videoUrls?: DSVideoUrl[] }
interface MediaItem { name?: string; url?: string; description?: string }
interface Meal { name?: string; description?: string; time?: string }
interface Announcement { message?: string; date?: string | Date }

export default function EditProgramForm({ program: initialProgram, mode, onSuccess }: EditProgramFormProps) {
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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kulvar-qb7t.onrender.com";

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
  const addDay = () => {
    setProgram((prev: any) => ({
      ...prev,
      dailySchedule: [
        ...prev.dailySchedule,
        { day: "Pazartesi", notes: "", sessions: [{ name: "Seans 1", exercises: [defaultExercise()] }] },
      ],
    }));
  };

  const removeDay = (dIdx: number) => {
    setProgram((prev: any) => ({
      ...prev,
      dailySchedule: prev.dailySchedule.filter((_: any, i: number) => i !== dIdx),
    }));
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
      sessions.push({ name: `Seans ${sessions.length + 1}`, exercises: [defaultExercise()] });
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

  const defaultExercise = (): DSExercise => ({ name: "Egzersiz", sets: 0, reps: 0, duration: "0 dakika", restTime: 0, videoUrls: [] });

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
        { name: "Egzersiz", sets: 0, reps: 0, duration: "0 dakika", videoUrls: [] },
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
      alert("✅ Program kaydedildi!");
      onSuccess?.();
    } catch (err: any) {
      console.error("Kaydetme hatası:", err);
      alert("❌ Kaydetme başarısız: " + (err?.message || "Unknown error"));
    }
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="space-y-8">
      {/* Core fields */}
      <section className="grid gap-4">
        <div>
          <Label htmlFor="name">Program Adı</Label>
          <Input name="name" value={(program as any).name || ""} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="description">Açıklama</Label>
          <Textarea name="description" value={(program as any).description || ""} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="duration">Süre (hafta)</Label>
          <Input name="duration" type="number" value={(program as any).duration ?? 0} onChange={simpleChange} />
        </div>

        <div>
          <Label htmlFor="difficulty">Zorluk</Label>
          <select
            name="difficulty"
            value={(program as any).difficulty || "Başlangıç"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            <option>Başlangıç</option>
            <option>Orta Düzey</option>
            <option>İleri Seviye</option>
          </select>
        </div>

        <div>
          <Label htmlFor="fitnessGoal">Hedef</Label>
          <select
            name="fitnessGoal"
            value={(program as any).fitnessGoal || "Genel Fitness"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            <option>Kilo Kaybı</option>
            <option>Kas Kazanımı</option>
            <option>Dayanıklılık</option>
            <option>Genel Fitness</option>
            <option>Genel Fitness ve Güç Geliştirme</option>
            <option>Hedefe Özel Gelişim</option>
          </select>
        </div>

        <div>
          <Label htmlFor="status">Durum</Label>
          <select
            name="status"
            value={(program as any).status || "Aktif"}
            onChange={simpleChange}
            className="w-full p-2 border rounded"
          >
            <option>Aktif</option>
            <option>Tamamlandı</option>
            <option>Durduruldu</option>
          </select>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Günlük Program</h2>
          <Button type="button" onClick={addDay}>Gün ekle</Button>
        </div>

        {(program as any).dailySchedule?.map((day: DSDay, dIdx: number) => (
          <div key={dIdx} className="border rounded-lg p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Gün</Label>
                <Input value={day.day || ""} onChange={(e) => updateDayField(dIdx, "day", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Notlar</Label>
                <Input value={day.notes || ""} onChange={(e) => updateDayField(dIdx, "notes", e.target.value)} />
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <h3 className="font-medium">Seanslar</h3>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => addSession(dIdx)}>Seans ekle</Button>
                <Button type="button" variant="destructive" onClick={() => removeDay(dIdx)}>Günü sil</Button>
              </div>
            </div>

            {(day.sessions || []).map((s: DSSession, sIdx: number) => (
              <div key={sIdx} className="rounded-lg border p-3 space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Seans adı</Label>
                    <Input value={s.name || ""} onChange={(e) => updateSessionName(dIdx, sIdx, e.target.value)} />
                  </div>
                  <Button type="button" variant="secondary" onClick={() => addExerciseToSession(dIdx, sIdx)}>Egzersiz ekle</Button>
                  <Button type="button" variant="destructive" onClick={() => removeSession(dIdx, sIdx)}>Seansı sil</Button>
                </div>

                {(s.exercises || []).map((ex: DSExercise, eIdx: number) => (
                  <div key={eIdx} className="border rounded p-3 space-y-3">
                    <div className="grid md:grid-cols-5 gap-2">
                      <div>
                        <Label>Egzersiz</Label>
                        <Input value={ex.name || ""} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label>Set</Label>
                        <Input type="number" value={ex.sets ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "sets", e.target.value)} />
                      </div>
                      <div>
                        <Label>Tekrar</Label>
                        <Input type="number" value={ex.reps ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "reps", e.target.value)} />
                      </div>
                      <div>
                        <Label>Süre</Label>
                        <Input value={ex.duration || "0 dakika"} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "duration", e.target.value)} />
                      </div>
                      <div>
                        <Label>Dinlenme (sn)</Label>
                        <Input type="number" value={ex.restTime ?? 0} onChange={(e) => updateExerciseField(dIdx, sIdx, eIdx, "restTime", e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Video Linkleri</h4>
                        <Button type="button" variant="secondary" onClick={() => addVideoUrlToExercise(dIdx, sIdx, eIdx)}>Link ekle</Button>
                      </div>
                      <div className="space-y-2">
                        {(ex.videoUrls || []).map((v, vIdx) => (
                          <div key={vIdx} className="grid md:grid-cols-2 gap-2">
                            <Input placeholder="https://..." value={v.url || ""} onChange={(e) => updateVideoUrl(dIdx, sIdx, eIdx, vIdx, "url", e.target.value)} />
                            <div className="flex gap-2">
                              <Input placeholder="Açıklama" value={v.description || ""} onChange={(e) => updateVideoUrl(dIdx, sIdx, eIdx, vIdx, "description", e.target.value)} />
                              <Button type="button" variant="destructive" onClick={() => removeVideoUrl(dIdx, sIdx, eIdx, vIdx)}>Sil</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" variant="destructive" onClick={() => removeExerciseFromSession(dIdx, sIdx, eIdx)}>Egzersizi sil</Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Standalone Exercises */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bağımsız Egzersizler</h2>
          <Button type="button" onClick={addStandaloneExercise}>Egzersiz ekle</Button>
        </div>
        {(program as any).exercises?.map((ex: StandaloneExercise, idx: number) => (
          <div key={idx} className="border rounded p-3 space-y-2">
            <div className="grid md:grid-cols-5 gap-2">
              <div>
                <Label>Egzersiz</Label>
                <Input value={ex.name || ""} onChange={(e) => updateStandaloneExercise(idx, "name", e.target.value)} />
              </div>
              <div>
                <Label>Set</Label>
                <Input type="number" value={ex.sets ?? 0} onChange={(e) => updateStandaloneExercise(idx, "sets", e.target.value)} />
              </div>
              <div>
                <Label>Tekrar</Label>
                <Input type="number" value={ex.reps ?? 0} onChange={(e) => updateStandaloneExercise(idx, "reps", e.target.value)} />
              </div>
              <div>
                <Label>Süre</Label>
                <Input value={ex.duration || "0 dakika"} onChange={(e) => updateStandaloneExercise(idx, "duration", e.target.value)} />
              </div>
              <div>
                <Label>—</Label>
                <Button type="button" variant="destructive" onClick={() => removeStandaloneExercise(idx)} className="w-full">Sil</Button>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Video Linkleri</h4>
                <Button type="button" variant="secondary" onClick={() => addStandaloneVideo(idx)}>Link ekle</Button>
              </div>
              <div className="space-y-2">
                {(ex.videoUrls || []).map((v, vIdx) => (
                  <div key={vIdx} className="grid md:grid-cols-2 gap-2">
                    <Input placeholder="https://..." value={v.url || ""} onChange={(e) => updateStandaloneVideo(idx, vIdx, "url", e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder="Açıklama" value={v.description || ""} onChange={(e) => updateStandaloneVideo(idx, vIdx, "description", e.target.value)} />
                      <Button type="button" variant="destructive" onClick={() => removeStandaloneVideo(idx, vIdx)}>Sil</Button>
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
        <h2 className="text-lg font-semibold">Beslenme Planı</h2>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>İpuçları</Label>
            <Button type="button" variant="secondary" onClick={addTip}>İpucu ekle</Button>
          </div>
          <div className="space-y-2">
            {(program as any).nutritionPlan?.tips?.map((t: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={t} onChange={(e) => updateTip(i, e.target.value)} />
                <Button type="button" variant="destructive" onClick={() => removeTip(i)}>Sil</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Öğünler</Label>
            <Button type="button" variant="secondary" onClick={addMeal}>Öğün ekle</Button>
          </div>
          <div className="space-y-2">
            {(program as any).nutritionPlan?.meals?.map((m: Meal, i: number) => (
              <div key={i} className="grid md:grid-cols-3 gap-2">
                <Input placeholder="Ad" value={m.name || ""} onChange={(e) => updateMeal(i, "name", e.target.value)} />
                <Input placeholder="Açıklama" value={m.description || ""} onChange={(e) => updateMeal(i, "description", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="Saat (örn: 12:30)" value={m.time || ""} onChange={(e) => updateMeal(i, "time", e.target.value)} />
                  <Button type="button" variant="destructive" onClick={() => removeMeal(i)}>Sil</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy Media (manual URLs) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Videolar (URL)</h2>
          <Button type="button" onClick={() => addLegacy("videos")}>Video ekle</Button>
        </div>
        {(program as any).videos?.map((v: MediaItem, i: number) => (
          <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
            <Input placeholder="Ad" value={v.name || ""} onChange={(e) => updateLegacy("videos", i, "name", e.target.value)} />
            <Input placeholder="https://..." value={v.url || ""} onChange={(e) => updateLegacy("videos", i, "url", e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Açıklama" value={v.description || ""} onChange={(e) => updateLegacy("videos", i, "description", e.target.value)} />
              <Button type="button" variant="destructive" onClick={() => removeLegacy("videos", i)}>Sil</Button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between mt-4">
         <h2 className="text-lg font-semibold">PDF’ler (URL)</h2>

          <Button type="button" onClick={() => addLegacy("pdfs")}>PDF ekle</Button>
        </div>
        {(program as any).pdfs?.map((v: MediaItem, i: number) => (
          <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
            <Input placeholder="Ad" value={v.name || ""} onChange={(e) => updateLegacy("pdfs", i, "name", e.target.value)} />
            <Input placeholder="https://..." value={v.url || ""} onChange={(e) => updateLegacy("pdfs", i, "url", e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Açıklama" value={v.description || ""} onChange={(e) => updateLegacy("pdfs", i, "description", e.target.value)} />
              <Button type="button" variant="destructive" onClick={() => removeLegacy("pdfs", i)}>Sil</Button>
            </div>
          </div>
        ))}
      </section>

      {/* Announcements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Duyurular</h2>
          <Button type="button" onClick={addAnnouncement}>Duyuru ekle</Button>
        </div>
        {(program as any).announcements?.map((a: Announcement, i: number) => (
          <div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3">
            <Input placeholder="Mesaj" value={a.message || ""} onChange={(e) => updateAnnouncement(i, "message", e.target.value)} />
            <Input type="datetime-local" value={formatForDatetimeLocal(a.date)} onChange={(e) => updateAnnouncement(i, "date", e.target.value)} />
            <div className="flex items-end">
              <Button type="button" variant="destructive" onClick={() => removeAnnouncement(i)} className="w-full">Sil</Button>
            </div>
          </div>
        ))}
      </section>

      <Button onClick={handleSave} className="w-full">
        {mode === "edit" ? "Güncelle" : "Oluştur"}
      </Button>
    </div>
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
