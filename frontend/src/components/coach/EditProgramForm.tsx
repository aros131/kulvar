// src/components/coach/EditProgramForm.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Program } from "@/types/program";

interface EditProgramFormProps {
  program: Program;
  mode: "edit" | "create";
  onSuccess?: () => void; // ✅ Define it here
}

export default function EditProgramForm({
  program: initialProgram,
  mode,
  onSuccess, // ✅ Use correct prop name
}: EditProgramFormProps) {
  const [program, setProgram] = useState<Program>(initialProgram);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const url = `https://kulvar-qb7t.onrender.com/programs/${program._id}`;
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(program),
      });

      if (res.ok) {
        alert("✅ Program kaydedildi!");
        onSuccess?.(); // ✅ Trigger callback if provided
      } else {
        alert("❌ Kaydetme başarısız.");
      }
    } catch (err) {
      console.error("🔴 Hata:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Program Adı</Label>
        <Input name="name" value={program.name} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea name="description" value={program.description} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="duration">Süre (hafta)</Label>
        <Input name="duration" type="number" value={program.duration} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="difficulty">Zorluk</Label>
        <Input name="difficulty" value={program.difficulty} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="fitnessGoal">Hedef</Label>
        <Input name="fitnessGoal" value={program.fitnessGoal} onChange={handleChange} />
      </div>

      <Button onClick={handleSave} className="w-full">
        {mode === "edit" ? "Güncelle" : "Oluştur"}
      </Button>
    </div>
  );
}
