// components/coach/ProgramList.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { fetchCoachPrograms } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, Dumbbell } from "lucide-react";

import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";
import EditProgramDialog from "@/components/coach/EditProgramDialog";

/* ----------------------------- Types ----------------------------- */
interface Client { _id: string; name: string; email: string; }
interface ClientForNotification { id: string; name: string; email: string; }
interface Program { _id: string; name: string; description: string; }
interface ProgramWithClients extends Program { assignedClients: Client[]; }

interface ProgramListProps {
  onClientsFetched?: (clients: ClientForNotification[]) => void;
  showHeader?: boolean; // hide if parent has its own header
}

/* ----------------------------- Component ----------------------------- */
const ProgramList: React.FC<ProgramListProps> = ({ onClientsFetched, showHeader = true }) => {
  const [programsWithClients, setProgramsWithClients] = useState<ProgramWithClients[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgramsWithClients = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token bulunamadı");

      const basePrograms = await fetchCoachPrograms(token);

      const detailedPrograms: ProgramWithClients[] = await Promise.all(
        basePrograms.map(async (program: Program) => {
          const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${program._id}`, {
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

  return (
    <div className="space-y-3">
      {showHeader && <h2 className="text-lg font-semibold">Programlarınız</h2>}

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start auto-rows-fr">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-full flex flex-col rounded-xl p-3 space-y-2">
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
      ) : programsWithClients.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Hiç program bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start auto-rows-fr">
          {programsWithClients.map((program, idx) => {
            const assignedCount = program.assignedClients?.length ?? 0;

            return (
              <motion.div
                key={program._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.18) }}
                className="h-full"
              >
                <Card className="h-full flex flex-col rounded-xl hover:shadow-md transition-shadow">
                  {/* Header */}
                  <CardHeader className="pb-1 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 grid place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 shrink-0">
                        <Dumbbell className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm font-medium leading-5 truncate">
                        {program.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  {/* Body */}
                  <CardContent className="px-3 py-2 space-y-2 grow">
                    {program.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {program.description}
                      </p>
                    ) : null}
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {assignedCount} atanmış danışan
                    </div>
                  </CardContent>

                  {/* Footer */}
                  <CardFooter
                    className="mt-auto px-3 pt-2 border-t flex items-center justify-between
                               [&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs [&_button]:rounded-md"
                  >
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
