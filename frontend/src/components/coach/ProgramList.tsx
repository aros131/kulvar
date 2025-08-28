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
    <div className="space-y-4">
      {showHeader && <h2 className="text-xl font-semibold">Programlarınız</h2>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-1 flex-wrap">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : programsWithClients.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            Hiç program bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programsWithClients.map((program, idx) => {
            const assignedCount = program.assignedClients?.length ?? 0;

            return (
              <motion.div
                key={program._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
              >
                <Card className="rounded-2xl hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 grid place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base md:text-lg line-clamp-1">
                        {program.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  {/* Body */}
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {program.description}
                    </p>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {assignedCount} atanmış danışan
                    </div>
                  </CardContent>

                  {/* Footer: compact actions + clear primary */}
                  <CardFooter className="border-t pt-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between
                    /* Make any button rendered by child dialog components compact */
                    [&_button]:h-9 [&_button]:px-3 [&_button]:text-sm [&_button]:rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* These components render their own buttons internally. */}
                      <EditProgramDialog
                        programId={program._id}
                        onUpdated={fetchProgramsWithClients}
                      />
                      <AssignClientsDialog programId={program._id} />
                      <DeleteProgramDialog
                        programId={program._id}
                        programName={program.name}
                        onDelete={fetchProgramsWithClients}
                      />
                    </div>

                    {/* Primary CTA on the right */}
                    <Button asChild size="sm" className="gap-1">
                      <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                        Programa bak <ArrowRight size={16} />
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

