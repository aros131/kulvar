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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Rule = { weekdays: number[]; startMin: number; endMin: number; stepMin: number };
type Interval = { startMin: number; endMin: number };
type Override = { _id?: string; date: string; kind: "open" | "closed"; intervals?: Interval[] };
type Blackout = { _id?: string; startDate: string; endDate: string };
type Slot = { startUtc: string; endUtc: string };

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/** Read JWT from localStorage, normalize accidental quotes & optional "Bearer " */
function cleanToken(): string | null {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    const val = trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
    return val.length ? val : null;
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

const DAYS: { key: number; labelTR: string }[] = [
  { key: 1, labelTR: "Pazartesi" },
  { key: 2, labelTR: "Salı" },
  { key: 3, labelTR: "Çarşamba" },
  { key: 4, labelTR: "Perşembe" },
  { key: 5, labelTR: "Cuma" },
  { key: 6, labelTR: "Cumartesi" },
  { key: 0, labelTR: "Pazar" },
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

export default function CoachAvailability() {
  const localTz = useMemo(() => DateTime.local().zoneName, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile (to find coachId for preview)
  const [coachId, setCoachId] = useState<string | null>(null);

  // Weekly rules (simple UI: one interval per day; backend supports multiple by storing separate rules if needed)
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [startByDay, setStartByDay] = useState<Record<number, string>>({});
  const [endByDay, setEndByDay] = useState<Record<number, string>>({});
  const [stepMin, setStepMin] = useState<number>(30);

  // Overrides & blackouts
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);

  // Draft override
  const [ovDate, setOvDate] = useState<string>("");
  const [ovKind, setOvKind] = useState<"open" | "closed">("open");
  const [ovStart, setOvStart] = useState<string>("10:00");
  const [ovEnd, setOvEnd] = useState<string>("18:00");

  // Draft blackout
  const [boStart, setBoStart] = useState<string>("");
  const [boEnd, setBoEnd] = useState<string>("");

  // Preview
  const [preview, setPreview] = useState<Slot[]>([]);
  const [previewMin, setPreviewMin] = useState<number>(30);

  // Load initial data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // who am I? (get my id for preview calls)
        const me = await authedFetch("/profile").then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (!alive) return;
        if (me?.id || me?._id) setCoachId(String(me.id || me._id));

        // rules
        const rulesRes = await authedFetch("/me/availability/rules");
        const rules: Rule[] = rulesRes.ok ? await rulesRes.json() : [];
        // normalize UI from rules
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
        // defaults
        for (const d of DAYS.map((x) => x.key)) {
          if (_enabled[d] == null) _enabled[d] = false;
          if (!_start[d]) _start[d] = "10:00";
          if (!_end[d]) _end[d] = "18:00";
        }
        setEnabled(_enabled);
        setStartByDay(_start);
        setEndByDay(_end);
        setStepMin(step);

        // overrides
        const ovRes = await authedFetch("/me/availability/overrides");
        setOverrides(ovRes.ok ? await ovRes.json() : []);

        // blackouts
        const boRes = await authedFetch("/me/availability/blackouts");
        setBlackouts(boRes.ok ? await boRes.json() : []);
      } catch (e) {
        console.error(e);
        toast.error("Veriler yüklenemedi.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Save weekly rules
  async function saveRules() {
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

      const res = await authedFetch("/me/availability/rules", {
        method: "PUT",
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error("save_failed");
      toast.success("Haftalık takvim kaydedildi.");
    } catch (e) {
      console.error(e);
      toast.error("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // Add override
  async function addOverride() {
    if (!ovDate) return toast.message("Tarih seçin.");
    try {
      const payload: Override =
        ovKind === "closed"
          ? { date: ovDate, kind: "closed" }
          : { date: ovDate, kind: "open", intervals: [{ startMin: hhmmToMin(ovStart), endMin: hhmmToMin(ovEnd) }] };

      const res = await authedFetch("/me/availability/overrides", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("override_failed");
      const created = await res.json();
      setOverrides((s) => [created, ...s]);
      setOvDate("");
      toast.success("Özel gün kaydedildi.");
    } catch (e) {
      console.error(e);
      toast.error("Özel gün eklenemedi.");
    }
  }

  // Remove override
  async function removeOverride(id?: string) {
    if (!id) return;
    try {
      const res = await authedFetch(`/me/availability/overrides/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setOverrides((s) => s.filter((o) => o._id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Silinemedi.");
    }
  }

  // Add blackout
  async function addBlackout() {
    if (!boStart || !boEnd) return toast.message("Başlangıç ve bitiş tarihlerini girin.");
    try {
      const payload: Blackout = { startDate: boStart, endDate: boEnd };
      const res = await authedFetch("/me/availability/blackouts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("blackout_failed");
      const created = await res.json();
      setBlackouts((s) => [created, ...s]);
      setBoStart("");
      setBoEnd("");
      toast.success("İzin dönemi eklendi.");
    } catch (e) {
      console.error(e);
      toast.error("İzin eklenemedi.");
    }
  }

  async function removeBlackout(id?: string) {
    if (!id) return;
    try {
      const res = await authedFetch(`/me/availability/blackouts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setBlackouts((s) => s.filter((b) => b._id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Silinemedi.");
    }
  }

  // Preview next 14 days using public availability endpoint
  async function loadPreview() {
    if (!coachId) return toast.message("Profil yükleniyor… tekrar deneyin.");
    try {
      const from = DateTime.now().toUTC().toISO();
      const to = DateTime.now().plus({ days: 14 }).toUTC().toISO();
      const res = await fetch(
        `${API}/coaches/${coachId}/availability?from=${encodeURIComponent(from!)}&to=${encodeURIComponent(to!)}&serviceMin=${previewMin}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("preview_failed");
      const data: Slot[] = await res.json();
      setPreview(data);
    } catch (e) {
      console.error(e);
      toast.error("Önizleme alınamadı.");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Uygunluk</CardTitle></CardHeader>
        <CardContent>Yükleniyor…</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Takvim (Yerel saat: {localTz})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {DAYS.map(({ key, labelTR }) => (
              <div key={key} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  <Switch
                    checked={!!enabled[key]}
                    onCheckedChange={(v) => setEnabled((s) => ({ ...s, [key]: v }))}
                    id={`d-${key}`}
                  />
                  <Label htmlFor={`d-${key}`}>{labelTR}</Label>
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <Label className="sr-only">Başlangıç</Label>
                  <Input
                    type="time"
                    value={startByDay[key] ?? "10:00"}
                    onChange={(e) => setStartByDay((s) => ({ ...s, [key]: e.target.value }))}
                    disabled={!enabled[key]}
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <Label className="sr-only">Bitiş</Label>
                  <Input
                    type="time"
                    value={endByDay[key] ?? "18:00"}
                    onChange={(e) => setEndByDay((s) => ({ ...s, [key]: e.target.value }))}
                    disabled={!enabled[key]}
                  />
                </div>
                <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Aralık</Label>
                  <Select value={String(stepMin)} onValueChange={(v) => setStepMin(parseInt(v, 10))}>
                    <SelectTrigger className="w-[140px]">
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
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={saveRules} disabled={saving}>{saving ? "Kaydediliyor…" : "Kaydet"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Özel Günler (Overrides)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <Label>Tarih</Label>
              <Input type="date" value={ovDate} onChange={(e) => setOvDate(e.target.value)} />
            </div>
            <div>
              <Label>Tür</Label>
              <Select value={ovKind} onValueChange={(v) => setOvKind(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Açık (sadece bu saatler)</SelectItem>
                  <SelectItem value="closed">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Başlangıç</Label>
              <Input type="time" value={ovStart} onChange={(e) => setOvStart(e.target.value)} disabled={ovKind === "closed"} />
            </div>
            <div>
              <Label>Bitiş</Label>
              <Input type="time" value={ovEnd} onChange={(e) => setOvEnd(e.target.value)} disabled={ovKind === "closed"} />
            </div>
          </div>
          <Button variant="outline" onClick={addOverride}>Ekle</Button>

          <Separator className="my-2" />

          <div className="space-y-2">
            {overrides.length === 0 ? (
              <div className="text-sm text-muted-foreground">Kayıt yok.</div>
            ) : overrides.map((o) => (
              <div key={o._id || o.date} className="flex items-center justify-between gap-3 border rounded-md p-2">
                <div className="text-sm">
                  <div className="font-medium">{o.date}</div>
                  <div className="text-muted-foreground">
                    {o.kind === "closed" ? "Kapalı" : (
                      o.intervals?.map((iv, i) => (
                        <Badge key={i} variant="secondary" className="mr-2">
                          {minToHHMM(iv.startMin)}–{minToHHMM(iv.endMin)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => removeOverride(o._id)}>Sil</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>İzin Dönemleri (Blackouts)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label>Başlangıç</Label>
              <Input type="date" value={boStart} onChange={(e) => setBoStart(e.target.value)} />
            </div>
            <div>
              <Label>Bitiş</Label>
              <Input type="date" value={boEnd} onChange={(e) => setBoEnd(e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <Button variant="outline" onClick={addBlackout}>Ekle</Button>
            </div>
          </div>

          <div className="space-y-2">
            {blackouts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Kayıt yok.</div>
            ) : blackouts.map((b) => (
              <div key={b._id || b.startDate + b.endDate} className="flex items-center justify-between gap-3 border rounded-md p-2">
                <div className="text-sm">
                  {b.startDate} → {b.endDate}
                </div>
                <Button variant="ghost" onClick={() => removeBlackout(b._id)}>Sil</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Önizleme (Müşterilerin Göreceği Slotlar)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>Hizmet Süresi</Label>
            <Select value={String(previewMin)} onValueChange={(v) => setPreviewMin(parseInt(v, 10))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 30, 45, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>{m} dk</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadPreview} variant="outline">Yenile</Button>
          </div>

          {preview.length === 0 ? (
            <div className="text-sm text-muted-foreground">Önizleme yok. “Yenile”ye tıklayın.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {preview.map((s) => {
                const local = DateTime.fromISO(s.startUtc).setZone(localTz);
                return (
                  <div key={s.startUtc} className="text-sm border rounded-md p-2">
                    {local.toFormat("ccc dd LLL, HH:mm")}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
