"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


import CoachPageShell from "@/components/coach/CoachPageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DailyScheduleForm from "@/components/program/DailyScheduleForm";
import type { DailyEntry } from "@/components/program/DailyScheduleForm"; // Eğer orada export ediyorsan
export default function CreateProgramPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: 4,
    difficulty: "Başlangıç",
    fitnessGoal: "Genel Fitness",
    priceCents: null as number | null,
  });



const [dailySchedule, setDailySchedule] = useState<DailyEntry[]>([]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        dailySchedule,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Program oluşturuldu.");
        router.push("/dashboard/coach/programs");
      } else {
        const err = await res.json();
        toast.error("Oluşturulamadı: " + err.message);
      }
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };

  return (
    <CoachPageShell>
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
      <h1 className="text-2xl font-bold">Yeni Program Oluştur</h1>

      {/* 🔽 Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="name">Program Adı</Label>
        <Input name="name" value={form.name} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea name="description" value={form.description} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Süre (hafta)</Label>
        <Input type="number" name="duration" value={form.duration} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label>Zorluk Seviyesi</Label>
        <Select value={form.difficulty} onValueChange={(v) => handleSelectChange("difficulty", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seçiniz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Başlangıç">Başlangıç</SelectItem>
            <SelectItem value="Orta Düzey">Orta Düzey</SelectItem>
            <SelectItem value="İleri Seviye">İleri Seviye</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Fitness Hedefi</Label>
        <Select value={form.fitnessGoal} onValueChange={(v) => handleSelectChange("fitnessGoal", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seçiniz" />
          </SelectTrigger>
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
          <Input
            className="pl-7"
            type="number"
            min={0}
            step={1}
            placeholder="0 — ücretsiz"
            value={form.priceCents != null ? form.priceCents / 100 : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Math.round(Number(e.target.value) * 100);
              setForm((prev) => ({ ...prev, priceCents: val }));
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Boş bırakırsanız program ücretsiz görünür.</p>
      </div>

      {/* 🔽 Daily Schedule */}
      <div className="space-y-2">
        <Label>Haftalık Program</Label>
        <DailyScheduleForm onChange={(data) => setDailySchedule(data)} />
      </div>

      {/* 🔽 Submit */}
      <Button onClick={handleSubmit} className="w-full">
        Program Oluştur
      </Button>
    </div>
    </CoachPageShell>
  );
}
