"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Client {
  _id: string;
  name: string;
  email: string;
}

export default function AssignClientsDialog({ programId }: { programId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("https://kulvar-qb7t.onrender.com/users/clients", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setClients(data.clients);
      } catch (err) {
        console.error("🚨 Error fetching clients:", err);
      }
    };

    fetchClients();
  }, []);

  const handleAssign = async () => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ clientIds: selected }),
      });
      if (res.ok) {
        alert("✅ Başarıyla atandı!");
      }
    } catch (err) {
      console.error("🚨 Hata:", err);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-60 pr-2">
        {clients.map((client) => (
          <div key={client._id} className="flex items-center gap-2">
            <Checkbox
              id={client._id}
              checked={selected.includes(client._id)}
              onCheckedChange={() => toggleSelection(client._id)}
            />
            <label htmlFor={client._id}>
              {client.name} ({client.email})
            </label>
          </div>
        ))}
      </ScrollArea>
      <Button onClick={handleAssign} className="w-full">
        Ata
      </Button>
    </div>
  );
}
