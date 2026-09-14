"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

interface Notification {
  _id: string;
  recipientId: { name: string };
  message: string;
  type: string;
  createdAt: string;
}

export default function SentNotificationsList() {
  const t = useTranslations("sentNotificationsList");
  const tType = useTranslations("sendNotificationDialog");
  const locale = useLocale();
  const typeLabels: Record<string, string> = {
    reminder: tType("typeReminder"),
    program_update: tType("typeProgramUpdate"),
    feedback: tType("typeFeedback"),
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/notifications/coach`, {
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
        toast.error(t("fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        notifications.map((n) => (
          <Card key={n._id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{n.recipientId?.name || t("unknownUser")}</p>
              <Badge>{typeLabels[n.type] || n.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(n.createdAt).toLocaleString(LOCALE_TAG[locale] || "tr-TR")}
            </p>
          </Card>
        ))
      )}
    </div>
  );
}
