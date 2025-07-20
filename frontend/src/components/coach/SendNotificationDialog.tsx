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
import { Select, SelectItem } from "@/components/ui/select";

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

export default function NotificationTemplatesDialog({ clients }: Props) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientId: selectedClient,
        message: selectedTemplate,
        type: "coach",
      }),
    });

    if (res.ok) {
      toast.success("Bildirim gönderildi!");
    } else {
      toast.error("Bir hata oluştu.");
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
          <div>
            <Label>Danışan Seç</Label>
            <Select onValueChange={setSelectedClient}>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Label>Mesaj Şablonu</Label>
            <Select onValueChange={setSelectedTemplate}>
              {templates.map((template, idx) => (
                <SelectItem key={idx} value={template}>
                  {template}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!selectedClient || !selectedTemplate}
          >
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
