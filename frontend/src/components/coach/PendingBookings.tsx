// components/coach/PendingBookings.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";
import { toast } from "sonner";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

function token() {
  const raw = localStorage.getItem("token") || "";
  return raw.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "");
}

export default function PendingBookings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings/pending`, {
        headers: { Authorization: `Bearer ${token()}` },
        cache: "no-store",
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Bekleyen istekler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: "approve" | "decline") {
    try {
      const res = await fetch(`${API}/bookings/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "İşlem başarısız");
      }
      toast.success(action === "approve" ? "Onaylandı" : "Reddedildi");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e:any) {
      toast.error(e.message || "Hata");
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Yükleniyor…</div>;
  if (items.length === 0) return <div className="text-sm text-muted-foreground">Bekleyen istek yok.</div>;

  return (
    <div className="space-y-3">
      {items.map((b) => (
        <div key={b._id} className="border rounded-md p-3 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{b?.userId?.name ?? "Kullanıcı"}</div>
            <div className="text-muted-foreground">
              {DateTime.fromISO(b.startUtc).toFormat("dd LLL yyyy, HH:mm")} – {DateTime.fromISO(b.endUtc).toFormat("HH:mm")} ({b.meetingMode === "online" ? "Online" : "Yüz Yüze"})
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => act(b._id, "approve")}>Onayla</Button>
            <Button size="sm" variant="outline" onClick={() => act(b._id, "decline")}>Reddet</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
