"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dot } from "lucide-react";

import CoachPageShell from "@/components/coach/CoachPageShell";
import SendNotificationDialog from "@/components/coach/SendNotificationDialog";
import ProgramList from "@/components/coach/ProgramList";
import SentNotificationsList from "@/components/coach/SentNotificationsList";

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ClientForNotification {
  id: string;
  name: string;
}

export default function CoachNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientForNotification[]>([]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    toast("Bildirim okundu olarak işaretlendi.");
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/mark-all-read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast("Tüm bildirimler okundu olarak işaretlendi.");
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <CoachPageShell unreadCount={unread.length}>
      <div className="hidden">
        <ProgramList onClientsFetched={setClients} />
      </div>

      <section className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
            <p className="text-sm text-muted-foreground">Gelen bildirimlerini yönet, danışanlarına duyuru gönder.</p>
          </div>
          <SendNotificationDialog clients={clients} />
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-1.5">
              Gelen
              {unread.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unread.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">Okunmamış</TabsTrigger>
            <TabsTrigger value="read">Okunmuş</TabsTrigger>
            <TabsTrigger value="sent">Gönderilenler</TabsTrigger>
          </TabsList>

          {/* Gelen — tümü */}
          <TabsContent value="inbox">
            {loading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hiç bildirimin yok.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => <NotifCard key={n._id} n={n} onRead={markAsRead} />)}
              </div>
            )}
          </TabsContent>

          {/* Okunmamış */}
          <TabsContent value="unread">
            {loading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : unread.length === 0 ? (
              <p className="text-sm text-muted-foreground">Okunmamış bildirimin yok.</p>
            ) : (
              <>
                <Button onClick={markAllAsRead} variant="outline" size="sm" className="mb-3">
                  Tümünü okundu yap
                </Button>
                <div className="space-y-3">
                  {unread.map((n) => <NotifCard key={n._id} n={n} onRead={markAsRead} />)}
                </div>
              </>
            )}
          </TabsContent>

          {/* Okunmuş */}
          <TabsContent value="read">
            {loading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : read.length === 0 ? (
              <p className="text-sm text-muted-foreground">Okunmuş bildirimin yok.</p>
            ) : (
              <div className="space-y-3">
                {read.map((n) => <NotifCard key={n._id} n={n} onRead={markAsRead} />)}
              </div>
            )}
          </TabsContent>

          {/* Gönderilenler */}
          <TabsContent value="sent">
            <SentNotificationsList />
          </TabsContent>
        </Tabs>
      </section>
    </CoachPageShell>
  );
}

function NotifCard({ n, onRead }: { n: { _id: string; message: string; isRead: boolean; createdAt: string }; onRead: (id: string) => void }) {
  return (
    <Card className={`p-4 border transition-all ${!n.isRead ? "border-blue-500" : ""}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {!n.isRead && (
              <Badge variant="default">
                <Dot className="w-4 h-4 animate-pulse mr-1" />
                Yeni
              </Badge>
            )}
            <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>
              {n.message}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(n.createdAt).toLocaleString("tr-TR", {
              hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
        {!n.isRead && (
          <Button variant="ghost" size="sm" className="text-xs px-2 shrink-0" onClick={() => onRead(n._id)}>
            okundu
          </Button>
        )}
      </div>
    </Card>
  );
}
