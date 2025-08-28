"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rule = { weekdays: number[]; startMin: number; endMin: number; stepMin: number };

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/** Reads token, trims quotes, strips 'Bearer ' */
function cleanToken(): string | null {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
}
function authedFetch(path: string, init: RequestInit = {}) {
  const token = cleanToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };
  return fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
}

const DAYS: { key: number; label: string }[] = [
  { key: 1, label: "Pazartesi" },
  { key: 2, label: "Salı" },
  { key: 3, label: "Çarşamba" },
  { key: 4, label: "Perşembe" },
  { key: 5, label: "Cuma" },
  { key: 6, label: "Cumartesi" },
  { key: 0, label: "Pazar" },
];

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}
function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function CoachAvailability({
  embedded = false,              // ⬅️ NEW: render content-only when true
}: {
  embedded?: boolean;
}) {
  const localTz = useMemo(() => DateTime.local().zoneName, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state: enable toggle + start/end per day + single global step
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [startByDay, setStartByDay] = useState<Record<number, string>>({});
  const [endByDay, setEndByDay] = useState<Record<number, string>>({});
  const [stepMin, setStepMin] = useState<number>(30);

  // Load existing weekly rules
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authedFetch("/dashboard/me/availability/rules");
        const rules: Rule[] = res.ok ? await res.json() : [];
        if (!alive) return;

        const _enabled: Record<number, boolean> = {};
        const _start: Record<number, string> = {};
        const _end: Record<number, string> = {};
        let step = 30;

        for (const r of rules) {
          step = r.stepMin || step;
          for (const d of r.weekdays) {
            _enabled[d] = true;
            _start[d] = minToHHMM(r.startMin);
            _end[d] = minToHHMM(r.endMin);
          }
        }
        for (const d of DAYS.map((x) => x.key)) {
          if (_enabled[d] == null) _enabled[d] = false;
          if (!_start[d]) _start[d] = "10:00";
          if (!_end[d]) _end[d] = "18:00";
        }
        setEnabled(_enabled);
        setStartByDay(_start);
        setEndByDay(_end);
        setStepMin(step);
      } catch (e) {
        console.error(e);
        toast.error("Uygunluk kuralları alınamadı.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    try {
      setSaving(true);
      const rules: Rule[] = DAYS.map((d) => d.key)
        .filter((d) => enabled[d])
        .map((d) => ({
          weekdays: [d],
          startMin: hhmmToMin(startByDay[d]),
          endMin: hhmmToMin(endByDay[d]),
          stepMin,
        }))
        .filter((r) => r.endMin > r.startMin);

      const res = await authedFetch("/dashboard/me/availability/rules", {
        method: "PUT",
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error("save_failed");
      toast.success("Uygunluk kuralları kaydedildi.");
    } catch (e) {
      console.error(e);
      toast.error("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Render helpers (Card vs Embedded) ----------
  const Content = (
    <>
      {/* Top meta + global slot length */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Yerel saat: <span className="font-medium text-foreground">{localTz}</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Slot uzunluğu</Label>
          <Select value={String(stepMin)} onValueChange={(v) => setStepMin(parseInt(v, 10))}>
            <SelectTrigger className="w-40 sm:w-48">
              <SelectValue placeholder="Adım (dk)" />
            </SelectTrigger>
            <SelectContent>
              {[15, 20, 30, 45, 60].map((m) => (
                <SelectItem key={m} value={String(m)}>{m} dk</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid gap-3">
        {DAYS.map(({ key, label }) => (
          <div
            key={key}
            className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3"
          >
            <div className="sm:col-span-3 flex items-center gap-2">
              <Switch
                checked={!!enabled[key]}
                onCheckedChange={(v) => setEnabled((s) => ({ ...s, [key]: v }))}
                id={`day-${key}`}
              />
              <Label htmlFor={`day-${key}`}>{label}</Label>
            </div>

            <div className="sm:col-span-4">
              <Label className="sr-only">Başlangıç</Label>
              <Input
                type="time"
                className="w-full"
                value={startByDay[key] ?? "10:00"}
                onChange={(e) => setStartByDay((s) => ({ ...s, [key]: e.target.value }))}
                disabled={!enabled[key]}
              />
            </div>

            <div className="sm:col-span-4">
              <Label className="sr-only">Bitiş</Label>
              <Input
                type="time"
                className="w-full"
                value={endByDay[key] ?? "18:00"}
                onChange={(e) => setEndByDay((s) => ({ ...s, [key]: e.target.value }))}
                disabled={!enabled[key]}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </>
  );

  if (loading) {
    return embedded ? (
      <div className="text-sm text-muted-foreground">Yükleniyor…</div>
    ) : (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Uygunluk</CardTitle>
        </CardHeader>
        <CardContent>Yükleniyor…</CardContent>
      </Card>
    );
  }

  return embedded ? (
    <div className="space-y-4">{Content}</div>
  ) : (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle>Haftalık Çalışma Saatleri</CardTitle>
        <div className="text-sm text-muted-foreground">Yerel saat: {localTz}</div>
      </CardHeader>
      <CardContent className="space-y-4">{Content}</CardContent>
    </Card>
  );
}
