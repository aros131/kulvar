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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients: Client[];
}

interface Notification {
  message: string;
  recipientName: string;
  timestamp: string;
}

const templates = [
  "Harika gidiyorsun! Bugünkü antrenmanı da unutma 💪",
  "Bugün motivasyonun düşükse bile küçük bir adım at 💫",
  "Takıldığın bir yer olursa bana yazabilirsin! 📩",
];

export default function NotificationTemplatesDialog({ clients }: Props) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [history, setHistory] = useState<Notification[]>([]);

  const handleToggleClient = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    const token = localStorage.getItem("token");

    const promises = selectedClients.map(async (clientId) => {
      const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          message: customMessage,
          type: "coach",
        }),
      });

      if (res.ok) {
        const clientName = clients.find((c) => c.id === clientId)?.name || "Bilinmeyen";
        setHistory((prev) => [
          {
            message: customMessage,
            recipientName: clientName,
            timestamp: new Date().toLocaleString(),
          },
          ...prev,
        ]);
        return true;
      }
      return false;
    });

    const results = await Promise.all(promises);

    if (results.every((r) => r)) {
      toast.success("Tüm bildirimler gönderildi!");
    } else {
      toast.error("Bazı bildirimler gönderilemedi.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">📨 Bildirim Gönder</Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Toplu Bildirim Gönder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Danışan Seç</Label>
            <ScrollArea className="h-40 p-2 border rounded">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => handleToggleClient(client.id)}
                  />
                  <span>{client.name}</span>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div>
            <Label>Hazır Mesaj Şablonu</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {templates.map((template, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomMessage(template)}
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Mesaj</Label>
            <Textarea
              placeholder="Mesajınızı buraya yazın..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleSend}
            disabled={selectedClients.length === 0 || customMessage.trim() === ""}
          >
            Gönder
          </Button>
        </DialogFooter>

        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">📋 Gönderilen Bildirimler</h3>
            <ScrollArea className="h-40 p-2 border rounded bg-gray-50">
              {history.map((item, i) => (
                <div key={i} className="mb-2">
                  <p className="text-sm text-gray-800">{item.message}</p>
                  <p className="text-xs text-gray-500">
                    Alıcı: {item.recipientName} — {item.timestamp}
                  </p>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
