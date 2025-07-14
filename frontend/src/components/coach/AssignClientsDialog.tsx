"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Client {
  _id: string;
  name: string;
  email: string;
}

export default function AssignClientsDialog({ programId }: { programId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);

  // 🔄 Fetch assigned clients (memoized)
  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setAssignedClients(data.program?.assignedClients || []);
    } catch {
      toast("❌ Atanmış kullanıcılar alınamadı");
    }
  }, [programId]);

  // 🔍 Search clients
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) return;
      try {
        const res = await fetch(
          `https://kulvar-qb7t.onrender.com/users/clients?q=${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        setSearchResults(data.clients);
      } catch {
        toast("❌ Kullanıcılar alınamadı");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // 🟢 On mount, fetch assigned clients
  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  const handleAssign = async (clientId: string) => {
    try {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/programs/${programId}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ clientIds: [clientId] }),
        }
      );

      if (res.ok) {
        toast("✅ Kullanıcı başarıyla atandı!");
        fetchAssigned();
      } else {
        toast("❌ Atama başarısız oldu.");
      }
    } catch {
      toast("❌ Sunucu hatası");
    }
  };

  const handleUnassign = async (clientId: string) => {
    try {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/programs/${programId}/unassign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ clientId }),
        }
      );

      if (res.ok) {
        toast("🚫 Kullanıcı atamadan kaldırıldı");
        fetchAssigned();
      } else {
        toast("❌ Kaldırma başarısız");
      }
    } catch {
      toast("❌ Sunucu hatası");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Atanmış Kullanıcılar</h3>
      <ScrollArea className="h-32 border p-2 rounded">
        {assignedClients.length > 0 ? (
          assignedClients.map((client) => (
            <div key={client._id} className="flex justify-between items-center py-1">
              <p className="text-sm">
                ✅ {client.name} ({client.email})
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnassign(client._id)}
              >
                Kaldır
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Henüz atama yapılmamış.</p>
        )}
      </ScrollArea>

      <Input
        placeholder="İsim veya e-posta ile kullanıcı ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />

      <ScrollArea className="h-60 border p-2 rounded">
        {searchResults.map((client) => (
          <div
            key={client._id}
            className="flex justify-between items-center py-2 border-b"
          >
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
            <Button size="sm" onClick={() => handleAssign(client._id)}>
              Ata
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
