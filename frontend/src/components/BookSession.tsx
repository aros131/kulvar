// components/BookSession.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  label,
  durationMin = 30,
  defaultOpen = false,
  buttonSize = "sm",
  buttonVariant = "default",
  className,
  onBooked,
}: Props) {
  const t = useTranslations("bookSession");
  const resolvedLabel = label ?? t("bookButton");
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
        if (!res.ok) throw new Error(t("availabilityError"));
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
          toast.error(t("availabilityFetchError"));
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
      toast.error(t("selectTimeAndMode"));
      return;
    }
    const token = cleanToken();
    if (!token) {
      toast.error(t("loginToContinue"));
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
        toast.success(t("requestSent"));
        setOpen(false);
        setSelectedSlot(null);
        setMeetingMode(null);
        onBooked?.();
        return;
      }

      const text = await res.text().catch(() => "");
      if (res.status === 409) {
        toast.error(t("slotTaken"));
      } else if (res.status === 400 && /too soon/i.test(text)) {
        toast.error(t("tooSoon"));
      } else if (res.status === 401) {
        toast.error(t("sessionExpired"));
      } else {
        console.error("Booking failed:", res.status, text);
        toast.error(t("requestFailed"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("connectionError"));
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
          {resolvedLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px] w-[calc(100vw-1rem)] p-0 overflow-hidden sm:rounded-2xl rounded-xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogSubtitle", { tz: localTz, offset: tzOffset })}
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
                <div className="text-sm font-medium">{t("chooseTime")}</div>
                {!date && <div className="text-sm text-muted-foreground">{t("chooseDayFirst")}</div>}
                {date && loadingSlots && (
                  <div className="text-sm text-muted-foreground">{t("loadingSlots")}</div>
                )}
                {date && !loadingSlots && daySlots.length === 0 && (
                  <div className="text-sm text-muted-foreground">{t("noSlotsThisDay")}</div>
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
                  <div className="text-sm font-medium">{t("meetingType")}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={meetingMode === "in_person" ? "default" : "outline"}
                      onClick={() => setMeetingMode("in_person")}
                    >
                      {t("inPerson")}
                    </Button>
                    <Button
                      size="sm"
                      variant={meetingMode === "online" ? "default" : "outline"}
                      onClick={() => setMeetingMode("online")}
                    >
                      {t("online")}
                    </Button>
                  </div>
                  <DialogFooter className="pt-1">
                    <Button size="sm" disabled={!meetingMode || posting} onClick={submit}>
                      {posting ? t("sending") : t("sendRequest")}
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
