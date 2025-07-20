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
  "Serra hayatının aşkı sakın onu bırakma!",
];

const types = ["reminder", "program_update", "feedback"];

export default function SendNotificationDialog({ clients }: Props) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
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
        clientId: selectedClient,
        message: selectedTemplate,
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

          <div>
            <Label>Bildirim Türü</Label>
            <Select onValueChange={setSelectedType} defaultValue="reminder">
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!selectedClient || !selectedTemplate || !selectedType}
          >
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
