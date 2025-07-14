// src/components/program/edit/ProgramGeneralForm.tsx

"use client";

import { Program } from "@/types/program";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  program: Program;
  onSuccess?: () => void; // ✅ Hata buradan kaynaklıydı
}

const ProgramGeneralForm = ({ program: initialProgram, onSuccess }: Props) => {
  const [program, setProgram] = useState<Program>(initialProgram);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${program._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(program),
      });

      if (res.ok) {
        alert("✅ Program güncellendi!");
        onSuccess?.(); // ✅ opsiyonel olarak çağır
      } else {
        alert("❌ Güncelleme başarısız.");
      }
    } catch (error) {
      console.error("Hata oluştu:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Program Adı</Label>
        <Input name="name" value={program.name} onChange={handleChange} />
      </div>

      <div>
        <Label>Açıklama</Label>
        <Textarea name="description" value={program.description} onChange={handleChange} />
      </div>

      <div>
        <Label>Süre (hafta)</Label>
        <Input name="duration" type="number" value={program.duration} onChange={handleChange} />
      </div>

      <div>
        <Label>Zorluk</Label>
        <Input name="difficulty" value={program.difficulty} onChange={handleChange} />
      </div>

      <div>
        <Label>Hedef</Label>
        <Input name="fitnessGoal" value={program.fitnessGoal} onChange={handleChange} />
      </div>

      <Button className="w-full" onClick={handleSave}>
        Güncelle
      </Button>
    </div>
  );
};

export default ProgramGeneralForm;
