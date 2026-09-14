"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients: Client[];
}

const types = ["reminder", "program_update", "feedback"];

export default function SendNotificationDialog({ clients }: Props) {
  const t = useTranslations("sendNotificationDialog");
  const templates = t.raw("templates") as string[];
  const typeLabels: Record<string, string> = {
    reminder: t("typeReminder"),
    program_update: t("typeProgramUpdate"),
    feedback: t("typeFeedback"),
  };
  const [selectedClient, setSelectedClient] = useState<string>("");

  const [message, setMessage] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("reminder");

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: selectedClient,
        message,
        type: selectedType,
      }),
    });

    if (res.ok) {
      toast.success(t("toastSuccess"));
    } else {
      const err = await res.json();
      toast.error(t("toastError", { message: err.message }));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">{t("trigger")}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Danışan */}
          <div>
            <Label>{t("clientLabel")}</Label>
            <Select onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder={t("clientPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Şablon seç */}
          <div>
            <Label>{t("templateLabel")}</Label>
            <Select
              onValueChange={(value) => {
                setMessage(value); // otomatik doldur
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("templatePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template, idx) => (
                  <SelectItem key={idx} value={template}>
                    {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Özel mesaj */}
          <div>
            <Label>{t("messageLabel")}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
            />
          </div>

          {/* Tür */}
          <div>
            <Label>{t("typeLabel")}</Label>
            <Select
              onValueChange={setSelectedType}
              defaultValue="reminder"
            >
              <SelectTrigger>
                <SelectValue placeholder={t("typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Önizleme */}
          {message && (
            <Card className="p-4 mt-4 border border-gray-300">
              <p className="text-sm text-muted-foreground mb-1 font-medium">{t("previewLabel")}</p>
              <p className="text-base">{message}</p>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!selectedClient || !message || !selectedType}
          >
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
