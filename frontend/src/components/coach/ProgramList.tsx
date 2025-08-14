"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import React, { useEffect, useState, useCallback } from "react";
import { fetchCoachPrograms } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";
import EditProgramDialog from "@/components/coach/EditProgramDialog";

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
}

const ProgramList: React.FC<ProgramListProps> = ({ onClientsFetched }) => {
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
        const uniqueClients = Array.from(uniqueClientsMap.values());
        onClientsFetched(uniqueClients);
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
    <div>
      <h2 className="text-xl font-semibold mb-4">Programlarınız</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))
          : programsWithClients.length === 0 ? (
              <p className="text-gray-500">Hiç program bulunamadı.</p>
            ) : (
              programsWithClients.map((program) => (
                <Card key={program._id} className="p-4 shadow space-y-2">
                  <h3 className="text-lg font-bold">{program.name}</h3>
                  <p>{program.description}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <EditProgramDialog
                      programId={program._id}
                      onUpdated={fetchProgramsWithClients}
                    />
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
                </Card>
              ))
            )}
      </div>
    </div>
  );
};

export default ProgramList;
