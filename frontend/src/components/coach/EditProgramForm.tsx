"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProgramDialogProps {
  programId: string;
  onSave?: () => void; // opsiyonel callback
}

export default function EditProgramDialog({ programId, onSave }: EditProgramDialogProps) {
  const [program, setProgram] = useState({
    name: "",
    description: "",
    duration: 0,
    difficulty: "",
    fitnessGoal: "",
  });

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setProgram(data.program);
      } catch (err) {
        console.error("🚨 Program detayları alınamadı:", err);
      }
    };

    fetchProgram();
  }, [programId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`https://kulvar-qb7t.onrender.com/programs/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(program),
      });
      if (res.ok) {
        alert("✅ Program güncellendi!");
        onSave?.(); // callback çağır
      } else {
        alert("❌ Güncelleme başarısız.");
      }
    } catch (err) {
      console.error("🔴 Güncelleme hatası:", err);
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
        <Input
          name="duration"
          type="number"
          value={program.duration}
          onChange={handleChange}
        />
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
        Kaydet
      </Button>
    </div>
  );
}
