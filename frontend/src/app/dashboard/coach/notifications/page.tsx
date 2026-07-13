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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/coach`, {
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

  const filtered = {
    all: notifications,
    unread: notifications.filter((n) => !n.isRead),
    read: notifications.filter((n) => n.isRead),
  };

  return (
    <CoachPageShell unreadCount={filtered.unread.length}>
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bildirimler</h1>
            <p className="text-sm text-muted-foreground">Gelen bildirimlerini yönet ve danışanlarına duyuru gönder.</p>
          </div>
          <SendNotificationDialog clients={clients} />
        </div>

        <SentNotificationsList />

        <div className="hidden">
          <ProgramList onClientsFetched={setClients} />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="unread">Okunmamış</TabsTrigger>
              <TabsTrigger value="read">Okunmuş</TabsTrigger>
            </TabsList>

            {(["all", "unread", "read"] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                {filtered[tab].length > 0 ? (
                  <>
                    {tab === "unread" && (
                      <Button onClick={markAllAsRead} className="mb-4" variant="outline">
                        Tümünü Okundu Yap
                      </Button>
                    )}
                    <div className="space-y-3">
                      {filtered[tab].map((n) => (
                        <Card
                          key={n._id}
                          className={`p-4 border transition-all duration-200 ${!n.isRead ? "border-blue-500" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
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
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            {!n.isRead && (
                              <Button variant="ghost" className="text-xs px-2" onClick={() => markAsRead(n._id)}>
                                okundu
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {tab === "unread"
                      ? "Okunmamış bildirimin yok."
                      : tab === "read"
                      ? "Okunmuş bildirimin yok."
                      : "Hiç bildirimin yok."}
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>
    </CoachPageShell>
  );
}
