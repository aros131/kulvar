"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UserPlus, UserMinus } from "lucide-react";

interface Client {
  _id: string;
  name: string;
  email: string;
}

export default function AssignClientsDialog({ programId }: { programId: string }) {
  const t = useTranslations("assignClientsDialog");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);

  const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // 🔄 Fetch assigned clients (memoized)
  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`${API}/programs/${programId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        cache: "no-store",
      });
      const data = await res.json();
      setAssignedClients(data.program?.assignedClients || []);
    } catch {
      toast(t("fetchAssignedError"));
    }
  }, [API, programId, t]);

  // 🔍 Search clients (debounced)
  useEffect(() => {
    if (!open) return; // only search while dialog is open
    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`${API}/users/clients?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setSearchResults(data.clients || []);
      } catch {
        toast(t("fetchUsersError"));
      }
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open, API]);

  // 🟢 When dialog opens, refresh assigned list
  useEffect(() => {
    if (open) fetchAssigned();
  }, [open, fetchAssigned]);

  const handleAssign = async (userId: string) => {
    try {
      const res = await fetch(`${API}/programs/${programId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userIds: [userId] }),
      });

      if (res.ok) {
        toast(t("assignSuccess"));
        fetchAssigned();
      } else {
        toast(t("assignFailed"));
      }
    } catch {
      toast(t("serverError"));
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      const res = await fetch(`${API}/programs/${programId}/unassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast(t("unassignSuccess"));
        fetchAssigned();
      } else {
        toast(t("unassignFailed"));
      }
    } catch {
      toast(t("serverError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" /> {t("assignButton")}
        </Button>
      </DialogTrigger>

      {/* Radix/Dialog renders in a portal -> does NOT affect grid item height */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">{t("assignedUsers")}</h3>
            <ScrollArea className="h-40 border rounded">
              <div className="p-2 space-y-2">
                {assignedClients.length > 0 ? (
                  assignedClients.map((client) => (
                    <div key={client._id} className="flex justify-between items-center py-1">
                      <p className="text-sm">✅ {client.name} ({client.email})</p>
                      <Button variant="destructive" size="sm" onClick={() => handleUnassign(client._id)}>
                        <UserMinus className="h-4 w-4 mr-1" /> {t("remove")}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noAssignmentsYet")}</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-56 border rounded">
              <div className="p-2">
                {searchResults.map((client) => (
                  <div key={client._id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAssign(client._id)}>{t("assignButton")}</Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
