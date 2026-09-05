"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateProgramPage() {
  const router = useRouter();

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
      toast.error("AI program üretemedi: " + err.message);
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
        name: g.seansAdi || "Seans 1",
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
    toast.success("AI programı uygulandı. İstediğin gibi düzenleyebilirsin.");
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API}/programs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...form, dailySchedule }),
      });
      if (res.ok) {
        toast.success("Program oluşturuldu.");
        router.push("/dashboard/coach/programs");
      } else {
        const err = await res.json();
        toast.error("Oluşturulamadı: " + err.message);
      }
    } catch {
      toast.error("Bir hata oluştu.");
    }
  };

  return (
    <CoachPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Yeni Program Oluştur</h1>
          <Button variant="outline" className="gap-2 border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            onClick={() => setShowAI(v => !v)}>
            <Sparkles className="w-4 h-4" />
            AI ile Oluştur
            {showAI ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* AI Program Generator */}
        {showAI && (
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Program Oluşturucu
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Hedef</Label>
                <select value={aiParams.goal} onChange={e => setAiParams(p => ({ ...p, goal: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option>Kas Kazanımı</option>
                  <option>Kilo Kaybı</option>
                  <option>Dayanıklılık</option>
                  <option>Genel Fitness</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Seviye</Label>
                <select value={aiParams.level} onChange={e => setAiParams(p => ({ ...p, level: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option>Başlangıç</option>
                  <option>Orta Düzey</option>
                  <option>İleri Seviye</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Haftada kaç gün</Label>
                <input type="number" min={1} max={7} value={aiParams.daysPerWeek}
                  onChange={e => setAiParams(p => ({ ...p, daysPerWeek: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Ekipman</Label>
                <select value={aiParams.equipment} onChange={e => setAiParams(p => ({ ...p, equipment: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option>Spor salonu</option>
                  <option>Ev (ekipmansız)</option>
                  <option>Dambıl ve bant</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Yaş (isteğe bağlı)</Label>
                <input type="number" value={aiParams.age} onChange={e => setAiParams(p => ({ ...p, age: e.target.value }))}
                  placeholder="örn. 28"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Cinsiyet (isteğe bağlı)</Label>
                <select value={aiParams.gender} onChange={e => setAiParams(p => ({ ...p, gender: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Belirtme</option>
                  <option>Erkek</option>
                  <option>Kadın</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Ek notlar (isteğe bağlı)</Label>
              <input type="text" value={aiParams.notes} onChange={e => setAiParams(p => ({ ...p, notes: e.target.value }))}
                placeholder="örn. diz sorunu var, squat'tan kaçın"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <Button onClick={generateWithAI} disabled={aiLoading} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</> : <><Sparkles className="w-4 h-4" /> Program Oluştur</>}
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
                  Bu Programı Uygula
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Program Adı</Label>
          <Input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Açıklama</Label>
          <Textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Süre (hafta)</Label>
          <Input type="number" name="duration" value={form.duration} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Zorluk Seviyesi</Label>
          <Select value={form.difficulty} onValueChange={(v) => setForm(p => ({ ...p, difficulty: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Başlangıç">Başlangıç</SelectItem>
              <SelectItem value="Orta Düzey">Orta Düzey</SelectItem>
              <SelectItem value="İleri Seviye">İleri Seviye</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fitness Hedefi</Label>
          <Select value={form.fitnessGoal} onValueChange={(v) => setForm(p => ({ ...p, fitnessGoal: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Kilo Kaybı">Kilo Kaybı</SelectItem>
              <SelectItem value="Kas Kazanımı">Kas Kazanımı</SelectItem>
              <SelectItem value="Dayanıklılık">Dayanıklılık</SelectItem>
              <SelectItem value="Genel Fitness">Genel Fitness</SelectItem>
              <SelectItem value="Genel Fitness ve Güç Geliştirme">Genel Fitness ve Güç Geliştirme</SelectItem>
              <SelectItem value="Hedefe Özel Gelişim">Hedefe Özel Gelişim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Program Fiyatı (₺)</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
            <Input className="pl-7" type="number" min={0} step={1} placeholder="0 — ücretsiz"
              value={form.priceCents != null ? form.priceCents / 100 : ""}
              onChange={(e) => setForm(p => ({ ...p, priceCents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) }))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Haftalık Program</Label>
          <DailyScheduleForm key={scheduleKey} onChange={(data) => setDailySchedule(data)} initial={{ dailySchedule }} />
        </div>

        <Button onClick={handleSubmit} className="w-full">Program Oluştur</Button>
      </div>
    </CoachPageShell>
  );
}
