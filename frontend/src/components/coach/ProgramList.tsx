// components/coach/ProgramList.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { fetchCoachPrograms } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ArrowRight, Users, Dumbbell } from "lucide-react";

import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";
import EditProgramDialog from "@/components/coach/EditProgramDialog";

/* ----------------------------- Types ----------------------------- */

// Backend'ten gelen client
interface Client {
  _id: string;
  name: string;
  email: string;
}

// SendNotificationDialog'un beklediği client tipi
interface ClientForNotification {
  id: string;
  name: string;
  email: string;
}

interface Program {
  _id: string;
  name: string;
  description: string;
}

interface ProgramWithClients extends Program {
  assignedClients: Client[];
}

interface ProgramListProps {
  onClientsFetched?: (clients: ClientForNotification[]) => void;
  /** When true, shows the internal header. Disable if parent already has a header. */
  showHeader?: boolean;
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
        const uniqueClientsMap = new Map<string, ClientForNotification>();
        detailedPrograms.forEach((program) => {
          program.assignedClients.forEach((client) => {
            uniqueClientsMap.set(client._id, {
              id: client._id,
              name: client.name,
              email: client.email,
            });
          });
        });
        onClientsFetched(Array.from(uniqueClientsMap.values()));
      }
    } catch (error) {
      console.error("🔴 Programlar alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }, [onClientsFetched]);

  useEffect(() => {
    fetchProgramsWithClients();
  }, [fetchProgramsWithClients]);

  return (
    <div className="space-y-4">
      {showHeader && <h2 className="text-xl font-semibold">Programlarınız</h2>}

      {/* Loading skeletons */}
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
                <Skeleton className="h-8 w-28" />
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
          {programsWithClients.map((program, idx) => (
            <motion.div
              key={program._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
            >
              <Card className="rounded-2xl hover:shadow-lg transition-shadow">
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

                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {program.description}
                  </p>

                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {program.assignedClients?.length ?? 0} atanmış danışan
                  </div>

                  <div className="mt-2 flex gap-2 flex-wrap">
                    <EditProgramDialog programId={program._id} onUpdated={fetchProgramsWithClients} />

                    <Button asChild variant="default" size="sm" className="gap-1">
                      <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                        Programa bak <ArrowRight size={16} />
                      </Link>
                    </Button>

                    <AssignClientsDialog programId={program._id} />

                    <DeleteProgramDialog
                      programId={program._id}
                      programName={program.name}
                      onDelete={fetchProgramsWithClients}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramList;
