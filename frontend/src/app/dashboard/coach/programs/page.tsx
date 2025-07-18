"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Program } from "@/types/program"; 
export default function ProgramOverviewPage() {
const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await axios.get(`https://kulvar-qb7t.onrender.com/programs`, {
          headers: {
            Authorization: `Bearer YOUR_TOKEN_HERE`
          }
        });
        setPrograms(res.data);
      } catch (error) {
        console.error("Programları çekerken hata:", error);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tüm Programlar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program._id} className="border p-4 rounded-xl shadow-sm">
            <h2 className="font-semibold">{program.name}</h2>
            <p>Hedef: {program.fitnessGoal}</p>
            <p>Zorluk: {program.difficulty}</p>
            <p>Süre: {program.duration} gün</p>
            <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
              <Button className="mt-2">Düzenle</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
