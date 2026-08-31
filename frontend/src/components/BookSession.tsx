// components/BookSession.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export type TimeSlot = { startUtc: string; endUtc: string };

type Props = {
  coachId: string;
  label?: string;
  durationMin?: number;
  defaultOpen?: boolean;

  /** Optional style hooks so it fits where you place it (hero, cards, etc.) */
  buttonSize?: "sm" | "md" | "lg";
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;

  /** Called on successful booking */
  onBooked?: () => void;
};

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

export default function BookSession({
  coachId,
  label = "Randevu Al",
  durationMin = 30,
  defaultOpen = false,
  buttonSize = "sm",
  buttonVariant = "default",
  className,
  onBooked,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingMode, setMeetingMode] = useState<"in_person" | "online" | null>(null);
  const [posting, setPosting] = useState(false);

  const localTz = useMemo(() => DateTime.local().zoneName, []);
  const tzOffset = useMemo(() => DateTime.local().toFormat("ZZ"), []);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Load availability when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingSlots(true);
    const from = DateTime.now().toUTC().toISO();
    const to = DateTime.now().plus({ weeks: 3 }).toUTC().toISO();
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${API}/coaches/${coachId}/availability?from=${encodeURIComponent(from!)}&to=${encodeURIComponent(
            to!
          )}&serviceMin=${durationMin}`,
          { credentials: "include", signal: controller.signal }
        );
        if (!res.ok) throw new Error("Uygunluk getirilemedi");
        const data: TimeSlot[] = await res.json();

        const sorted = data
          .slice()
          .sort(
            (a, b) =>
              DateTime.fromISO(a.startUtc).toMillis() - DateTime.fromISO(b.startUtc).toMillis()
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

  // When day changes, filter slots for that day
  useEffect(() => {
    if (!open) return;
    if (!date) {
      setDaySlots([]);
      setSelectedSlot(null);
      setMeetingMode(null);
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

  async function submit() {
    if (!selectedSlot || !meetingMode) {
      toast.error("Lütfen saat ve görüşme türü seçin.");
      return;
    }
    const token = cleanToken();
    if (!token) {
      toast.error("Devam etmek için giriş yapın.");
      return;
    }
    try {
      setPosting(true);
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          coachId,
          startUtc: selectedSlot.startUtc,
          endUtc: selectedSlot.endUtc,
          meetingMode,
        }),
      });

      if (res.status === 201) {
        toast.success("İstek gönderildi. Koç onaylayınca bildirileceksiniz.");
        setOpen(false);
        setSelectedSlot(null);
        setMeetingMode(null);
        onBooked?.();
        return;
      }

      const text = await res.text().catch(() => "");
      if (res.status === 409) {
        toast.error("Bu saat az önce alındı. Başka bir saat seçin.");
      } else if (res.status === 400 && /too soon/i.test(text)) {
        toast.error("Bu saat çok yakın. Daha ileri bir saat seçin.");
      } else if (res.status === 401) {
        toast.error("Oturum doğrulanamadı. Yeniden giriş yapın.");
      } else {
        console.error("Booking failed:", res.status, text);
        toast.error("İstek gönderilemedi. Tekrar deneyin.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div id="book" />
      <DialogTrigger asChild>
        <Button
          size={buttonSize === "md" ? "default" : (buttonSize as any)}
          variant={buttonVariant}
          className={className}
        >
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px] w-[calc(100vw-1rem)] p-0 overflow-hidden sm:rounded-2xl rounded-xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Uygunluk & Rezervasyon</DialogTitle>
          <DialogDescription>
            Tüm saatler yerel saatinize göre gösterilir ({localTz}, GMT{tzOffset}).
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="p-4">
          {/* Responsive layout: 1 column on mobile, 2 columns on md+ */}
          <div className="grid gap-4 md:grid-cols-[320px,1fr] max-h-[70vh] md:max-h-[64vh] overflow-y-auto pr-1">
            {/* Left: Calendar */}
            <div className="md:sticky md:top-0 md:self-start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                disabled={[() => loadingSlots, { before: startOfToday }]}
                modifiers={{
                  available: (day) => availableSet.has(DateTime.fromJSDate(day).toISODate()!),
                }}
              />
            </div>

            {/* Right: Slots & mode */}
            <div className="grid gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {daySlots.map((s) => {
                      const local = DateTime.fromISO(s.startUtc).setZone(localTz);
                      const active = selectedSlot?.startUtc === s.startUtc;
                      return (
                        <Button
                          key={s.startUtc}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          onClick={() => setSelectedSlot(s)}
                          className="justify-center"
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
                      size="sm"
                      variant={meetingMode === "in_person" ? "default" : "outline"}
                      onClick={() => setMeetingMode("in_person")}
                    >
                      Yüz yüze
                    </Button>
                    <Button
                      size="sm"
                      variant={meetingMode === "online" ? "default" : "outline"}
                      onClick={() => setMeetingMode("online")}
                    >
                      Online
                    </Button>
                  </div>
                  <DialogFooter className="pt-1">
                    <Button size="sm" disabled={!meetingMode || posting} onClick={submit}>
                      {posting ? "Gönderiliyor…" : "İsteği Gönder"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
