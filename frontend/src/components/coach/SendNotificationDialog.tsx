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

const templates = [
  "Harika gidiyorsun! Bugünkü antrenmanı da unutma 💪",
  "Bugün motivasyonun düşükse bile küçük bir adım at 💫",
  "Takıldığın bir yer olursa bana yazabilirsin! 📩",
 
];

const typeLabels: Record<string, string> = {
  reminder: "Hatırlatma",
  program_update: "Program Güncellemesi",
  feedback: "Geri Bildirim",
};

const types = Object.keys(typeLabels);

export default function SendNotificationDialog({ clients }: Props) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  
  const [message, setMessage] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("reminder");

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications", {
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
      toast.success("Bildirim gönderildi!");
    } else {
      const err = await res.json();
      toast.error("Hata: " + err.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">📨 Bildirim Gönder</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hızlı Bildirim Gönder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Danışan */}
          <div>
            <Label>Danışan Seç</Label>
            <Select onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Danışan seçin" />
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
            <Label>Hazır Mesaj Şablonu</Label>
            <Select
              onValueChange={(value) => {
                
                setMessage(value); // otomatik doldur
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Şablon seçin (opsiyonel)" />
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
            <Label>Mesaj İçeriği</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
            />
          </div>

          {/* Tür */}
          <div>
            <Label>Bildirim Türü</Label>
            <Select
              onValueChange={setSelectedType}
              defaultValue="reminder"
            >
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
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
              <p className="text-sm text-muted-foreground mb-1 font-medium">Önizleme:</p>
              <p className="text-base">{message}</p>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!selectedClient || !message || !selectedType}
          >
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
