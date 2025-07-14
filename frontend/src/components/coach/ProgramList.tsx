"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DeleteProgramDialog from "@/components/coach/DeleteProgramDialog";
import AssignClientsDialog from "@/components/coach/AssignClientsDialog";


interface Program {
  _id: string;
  name: string;
  description: string;
}

const ProgramList: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`https://kulvar-qb7t.onrender.com/programs/coach`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      console.log("🟢 Gelen programlar:", res.data.programs);
res.data.programs.forEach((p: Program) => {
  console.log(`Program adı: ${p.name}, ID: ${p._id} (${p._id.length} karakter)`);
});


      setPrograms(res.data.programs);
    } catch (error) {
      console.error("🔴 Programlar yüklenirken hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Programlarınız</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program._id} className="border rounded p-4 shadow">
            <h3 className="text-lg font-bold">{program.name}</h3>
            <p>{program.description}</p>
            <div className="mt-2 flex gap-2">
              <Link href={`/dashboard/coach/programs/${program._id}`}>

                <button className="bg-blue-500 text-white px-3 py-1 rounded">Düzenle</button>
              </Link>

              {/* ATA (Dialog) */}
              <AssignClientsDialog programId={program._id} />

              {/* SİL (Dialog) */}
              <DeleteProgramDialog
                programId={program._id}
                programName={program.name}
                onDelete={fetchPrograms}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramList;
