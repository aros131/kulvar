"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  _id: string;
  recipientId: { name: string };
  message: string;
  type: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  reminder: "Hatırlatma",
  program_update: "Program Güncellemesi",
  feedback: "Geri Bildirim",
};

export default function SentNotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications/coach", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setNotifications(data.notifications);
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Gönderilen bildirimler alınamadı");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📤 Gönderilen Bildirimler</h3>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz gönderilmiş bir bildirim yok.</p>
      ) : (
        notifications.map((n) => (
          <Card key={n._id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{n.recipientId?.name || "Bilinmeyen"}</p>
              <Badge>{typeLabels[n.type] || n.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(n.createdAt).toLocaleString("tr-TR")}
            </p>
          </Card>
        ))
      )}
    </div>
  );
}
