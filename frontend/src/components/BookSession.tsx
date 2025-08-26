// components/BookSession.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

export type TimeSlot = { startUtc: string; endUtc: string };

type Props = {
  coachId: string;
  label?: string;
  durationMin?: number;
  /** Sayfa #book ile açılırsa otomatik diyalog açmak için */
  defaultOpen?: boolean;
};

export default function BookSession({
  coachId,
  label = "Randevu Al",
  durationMin = 30,
  defaultOpen = false,
}: Props) {
  // 🔽 ilk render’da auto-open
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingMode, setMeetingMode] = useState<"in_person" | "zoom" | null>(null);
  const [posting, setPosting] = useState(false);

  const localTz = useMemo(() => DateTime.local().zoneName, []);
  const tzOffset = useMemo(() => DateTime.local().toFormat("ZZ"), []);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const startOfToday = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoadingSlots(true);
    const from = DateTime.now().toUTC().toISO();
    const to = DateTime.now().plus({ weeks: 3 }).toUTC().toISO();
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${API}/coaches/${coachId}/availability?from=${encodeURIComponent(from!)}&to=${encodeURIComponent(to!)}&serviceMin=${durationMin}`,
          { credentials: "include", signal: controller.signal }
        );
        if (!res.ok) throw new Error("Uygunluk getirilemedi");
        const data: TimeSlot[] = await res.json();
        const sorted = data.slice().sort(
          (a, b) => DateTime.fromISO(a.startUtc).toMillis() - DateTime.fromISO(b.startUtc).toMillis()
        );
        setSlots(sorted);
        const days = new Set<string>();
        for (const s of sorted) {
          days.add(DateTime.fromISO(s.startUtc).setZone(localTz).toISODate()!);
        }
        setAvailableDates(Array.from(days));
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          toast.error("Uygunluk alınamadı. Lütfen daha sonra tekrar deneyin.");
        }
      } finally {
        setLoadingSlots(false);
      }
    })();
    return () => controller.abort();
  }, [open, coachId, durationMin, localTz]);

  useEffect(() => {
    if (!open) return; // diyalog kapalıyken boşuna temizleme yapma
    if (!date) {
      setDaySlots([]); setSelectedSlot(null); setMeetingMode(null);
      return;
    }
    const sel = DateTime.fromJSDate(date).toISODate();
    const filtered = slots.filter(
      (s) => DateTime.fromISO(s.startUtc).setZone(localTz).toISODate() === sel
    );
    setDaySlots(filtered);
    setSelectedSlot(null);
    setMeetingMode(null);
  }, [open, date, slots, localTz]);

  async function submit() { /* mevcut POST akışını koru */ }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* hash scroll için bir çapa bırakıyoruz */}
      <div id="book" />
      <DialogTrigger asChild>
        <Button size="lg">{label}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Uygunluk & Rezervasyon</DialogTitle>
          <DialogDescription>
            Tüm saatler yerel saatinize göre gösterilir ({localTz}, GMT{tzOffset}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={[
              () => loadingSlots,
              { before: startOfToday },
            ]}
            modifiers={{
              available: (day) =>
                availableSet.has(DateTime.fromJSDate(day).toISODate()!),
            }}
          />

          <div className="grid gap-2">
            <div className="text-sm font-medium">Saat Seçin</div>
            {!date && <div className="text-sm text-muted-foreground">Önce bir gün seçin.</div>}
            {date && loadingSlots && (
              <div className="text-sm text-muted-foreground">Saatler yükleniyor…</div>
            )}
            {date && !loadingSlots && daySlots.length === 0 && (
              <div className="text-sm text-muted-foreground">Bu gün için uygun saat yok.</div>
            )}
            {date && !loadingSlots && daySlots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {daySlots.map((s) => {
                  const local = DateTime.fromISO(s.startUtc).setZone(localTz);
                  const active = selectedSlot?.startUtc === s.startUtc;
                  return (
                    <Button
                      key={s.startUtc}
                      variant={active ? "default" : "outline"}
                      onClick={() => setSelectedSlot(s)}
                    >
                      {local.toFormat("HH:mm")}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="grid gap-3 border rounded-xl p-3">
              <div className="text-sm font-medium">Görüşme Türü</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={meetingMode === "in_person" ? "default" : "outline"}
                  onClick={() => setMeetingMode("in_person")}
                >
                  Yüz yüze
                </Button>
                <Button
                  variant={meetingMode === "zoom" ? "default" : "outline"}
                  onClick={() => setMeetingMode("zoom")}
                >
                  Zoom
                </Button>
              </div>
              <DialogFooter>
                <Button disabled={!meetingMode || posting} onClick={submit}>
                  {posting ? "Gönderiliyor…" : "İsteği Gönder"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
