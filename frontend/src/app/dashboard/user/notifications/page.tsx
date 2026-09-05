"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, CheckCheck, Circle } from "lucide-react";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function NotifSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 flex items-start gap-3 transition-colors ${
        !n.isRead ? "border-primary/30 bg-primary/[0.03]" : ""
      }`}
    >
      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        n.isRead ? "bg-muted" : "bg-primary/10"
      }`}>
        <Bell className={`h-4 w-4 ${n.isRead ? "text-muted-foreground" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>
          {n.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{fmtDate(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <button
          onClick={() => onRead(n._id)}
          className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Circle className="h-2 w-2 fill-primary" />
          okundu
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border bg-card py-14 text-center space-y-2">
      <CheckCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/notifications/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/notifications/user/mark-all-read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Tüm bildirimler okundu.");
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <UserPageShell unreadCount={unread.length}>
      <section className="max-w-2xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bildirimler</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Koçundan ve sistemden gelen bildirimler</p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="shrink-0">
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Tümünü okundu yap
            </Button>
          )}
        </div>

        {loading ? (
          <NotifSkeleton />
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">Tümü{notifications.length > 0 && ` (${notifications.length})`}</TabsTrigger>
              <TabsTrigger value="unread">Okunmamış{unread.length > 0 && ` (${unread.length})`}</TabsTrigger>
              <TabsTrigger value="read">Okunmuş</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {notifications.length === 0
                ? <EmptyState text="Hiç bildirimin yok." />
                : notifications.map((n) => <NotifItem key={n._id} n={n} onRead={markAsRead} />)}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3 mt-4">
              {unread.length === 0
                ? <EmptyState text="Okunmamış bildirimin yok." />
                : unread.map((n) => <NotifItem key={n._id} n={n} onRead={markAsRead} />)}
            </TabsContent>

            <TabsContent value="read" className="space-y-3 mt-4">
              {read.length === 0
                ? <EmptyState text="Okunmuş bildirimin yok." />
                : read.map((n) => <NotifItem key={n._id} n={n} onRead={markAsRead} />)}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </UserPageShell>
  );
}
