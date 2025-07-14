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

export default function AssignClientsToGroup({ groupId }: { groupId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [groupMembers, setGroupMembers] = useState<Client[]>([]);

  // 🔄 Fetch group members (memoized)
  const fetchGroupMembers = useCallback(async () => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setGroupMembers(data.clientIds || []);
    } catch {
      toast("❌ Grup üyeleri alınamadı");
    }
  }, [groupId]);

  // 🔍 Search users
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) return;
      try {
        const res = await fetch(`https://kulvar-qb7t.onrender.com/users/clients?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setSearchResults(data.clients || []);
      } catch {
        toast("❌ Kullanıcı araması başarısız");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  const handleAssign = async (clientId: string) => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/groups/${groupId}/add-client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ clientId }),
      });

      if (res.ok) {
        toast("✅ Kullanıcı gruba eklendi");
        fetchGroupMembers();
      } else {
        toast("❌ Ekleme başarısız");
      }
    } catch {
      toast("❌ Sunucu hatası");
    }
  };

  const handleRemove = async (clientId: string) => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/groups/${groupId}/remove-client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ clientId }),
      });

      if (res.ok) {
        toast("🚫 Kullanıcı çıkarıldı");
        fetchGroupMembers();
      } else {
        toast("❌ Kaldırma başarısız");
      }
    } catch {
      toast("❌ Sunucu hatası");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Grup Üyeleri</h3>
      <ScrollArea className="h-32 border p-2 rounded">
        {groupMembers.length > 0 ? (
          groupMembers.map((client) => (
            <div key={client._id} className="flex justify-between items-center text-sm">
              ✅ {client.name} ({client.email})
              <Button variant="destructive" size="sm" onClick={() => handleRemove(client._id)}>
                Kaldır
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Henüz üye yok.</p>
        )}
      </ScrollArea>

      <Input
        placeholder="Kullanıcı ara (isim, e-posta)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <ScrollArea className="h-60 border p-2 rounded">
        {searchResults.map((client) => (
          <div key={client._id} className="flex justify-between items-center py-2 border-b">
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
