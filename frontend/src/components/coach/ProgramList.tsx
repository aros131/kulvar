"use client";

import React, { useEffect, useState } from "react";
import { fetchCoachPrograms } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";
import EditProgramDialog from "@/components/coach/EditProgramDialog";

interface Program {
  _id: string;
  name: string;
  description: string;
}

const ProgramList: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true); // ✅ loading state

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token bulunamadı");

      const programs = await fetchCoachPrograms(token);
      console.log("🟢 Gelen programlar:", programs);
      programs.forEach((p: Program) => {
        console.log(`Program adı: ${p.name}, ID: ${p._id}`);
      });
      setPrograms(programs);
    } catch (error) {
      console.error("🔴 Programlar yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false); // ✅ stop skeleton
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

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
          : programs.length === 0 ? (
              <p className="text-gray-500">Hiç program bulunamadı.</p>
            ) : (
              programs.map((program) => (
                <Card key={program._id} className="p-4 shadow space-y-2">
                  <h3 className="text-lg font-bold">{program.name}</h3>
                  <p>{program.description}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <EditProgramDialog
                      programId={program._id}
                      onUpdated={fetchPrograms}
                    />
                    <AssignClientsDialog programId={program._id} />
                    <DeleteProgramDialog
                      programId={program._id}
                      programName={program.name}
                      onDelete={fetchPrograms}
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
