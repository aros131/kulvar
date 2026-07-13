// components/coach/ConfirmedBookings.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

function token() {
  const raw = localStorage.getItem("token") || "";
  return raw.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "");
}

export default function ConfirmedBookings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings/confirmed`, {
        headers: { Authorization: `Bearer ${token()}` },
        cache: "no-store",
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Onaylanmış randevular alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markComplete(id: string) {
    setCompleting(id);
    try {
      const res = await fetch(`${API}/bookings/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "İşlem başarısız");
      }
      toast.success("Seans tamamlandı olarak işaretlendi.");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Hata");
    } finally {
      setCompleting(null);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Yükleniyor…</div>;
  if (items.length === 0) return <div className="text-sm text-muted-foreground">Onaylanmış randevu yok.</div>;

  return (
    <div className="space-y-3">
      {items.map((b) => {
        const isPast = DateTime.fromISO(b.endUtc) < DateTime.utc();
        return (
          <div key={b._id} className="border rounded-md p-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{b?.userId?.name ?? "Kullanıcı"}</div>
              <div className="text-muted-foreground">
                {DateTime.fromISO(b.startUtc).toFormat("dd LLL yyyy, HH:mm")} – {DateTime.fromISO(b.endUtc).toFormat("HH:mm")} ({b.meetingMode})
              </div>
            </div>
            <Button
              size="sm"
              variant={isPast ? "default" : "outline"}
              disabled={completing === b._id}
              onClick={() => markComplete(b._id)}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tamamlandı
            </Button>
          </div>
        );
      })}
    </div>
  );
}
