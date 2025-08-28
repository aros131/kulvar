"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { fetchCoachPrograms } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Users, Dumbbell, Search, ListFilter } from "lucide-react";

import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";
import EditProgramDialog from "@/components/coach/EditProgramDialog";

/* ----------------------------- Types ----------------------------- */
interface Client { _id: string; name: string; email: string; }
interface ClientForNotification { id: string; name: string; email: string; }
interface Program { _id: string; name: string; description: string; createdAt?: string }
interface ProgramWithClients extends Program { assignedClients: Client[] }

interface ProgramListProps {
  onClientsFetched?: (clients: ClientForNotification[]) => void;
  showHeader?: boolean; // hide if parent has its own header
}

/* ----------------------------- Component ----------------------------- */
const ProgramList: React.FC<ProgramListProps> = ({ onClientsFetched, showHeader = true }) => {
  const [programsWithClients, setProgramsWithClients] = useState<ProgramWithClients[]>([]);
  const [loading, setLoading] = useState(true);

  // UI controls
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "clients">("recent");

  const fetchProgramsWithClients = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("Token bulunamadı");

      const basePrograms = await fetchCoachPrograms(token);

      const detailedPrograms: ProgramWithClients[] = await Promise.all(
        basePrograms.map(async (program: Program) => {
          const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${program._id}` , {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const data = await res.json();
          return {
            ...program,
            assignedClients: data.program?.assignedClients || [],
          };
        })
      );

      setProgramsWithClients(detailedPrograms);

      // unique clients to bubble up for notification dialog
      if (onClientsFetched) {
        const uniq = new Map<string, ClientForNotification>();
        detailedPrograms.forEach((pg) =>
          pg.assignedClients.forEach((c) =>
            uniq.set(c._id, { id: c._id, name: c.name, email: c.email })
          )
        );
        onClientsFetched(Array.from(uniq.values()));
      }
    } catch (error) {
      console.error("🔴 Programlar alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }, [onClientsFetched]);

  useEffect(() => { fetchProgramsWithClients(); }, [fetchProgramsWithClients]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const arr = lower
      ? programsWithClients.filter(p => p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower))
      : [...programsWithClients];

    return arr.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "clients") return (b.assignedClients?.length || 0) - (a.assignedClients?.length || 0);
      // recent (fallback to name if no dates)
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad || a.name.localeCompare(b.name);
    });
  }, [programsWithClients, query, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header + controls */}
      {showHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Programlarınız</h2>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Program ara..."
                className="pl-8"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px]">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">En yeni</SelectItem>
                <SelectItem value="name">İsim A→Z</SelectItem>
                <SelectItem value="clients">En çok danışan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="min-h-[160px] flex flex-col rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="mt-auto flex gap-2 pt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Kriterlere uygun program bulunamadı.
          </CardContent>
        </Card>
      ) : (
        // IMPORTANT: removed `auto-rows-fr` to prevent overlap. Let rows auto-size.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((program, idx) => {
            const assignedCount = program.assignedClients?.length ?? 0;

            return (
              <motion.div
                key={program._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.18) }}
              >
                <Card className="min-h-[170px] flex flex-col rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <CardHeader className="pb-1 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 grid place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 shrink-0">
                        <Dumbbell className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm font-medium leading-5 truncate" title={program.name}>
                        {program.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  {/* Body */}
                  <CardContent className="px-3 py-2 space-y-2">
                    {program.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">{program.description}</p>
                    ) : null}
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {assignedCount} atanmış danışan
                    </div>
                  </CardContent>

                  {/* Footer */}
                  <CardFooter className="mt-auto px-3 pt-2 border-t flex items-center justify-between [&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs [&_button]:rounded-md">
                    <div className="flex items-center gap-1.5">
                      <EditProgramDialog programId={program._id} onUpdated={fetchProgramsWithClients} />
                      <AssignClientsDialog programId={program._id} />
                      <DeleteProgramDialog
                        programId={program._id}
                        programName={program.name}
                        onDelete={fetchProgramsWithClients}
                      />
                    </div>

                    <Button asChild size="sm" className="h-8 px-2.5 text-xs gap-1">
                      <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                        Programa bak <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgramList;
