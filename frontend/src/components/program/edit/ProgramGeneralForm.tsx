"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Program } from "@/types/program";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface ProgramGeneralFormProps {
  programId: string;
  onSuccess?: () => void;
}

const difficultyOptions = ["Başlangıç", "Orta Düzey", "İleri Seviye"];
const fitnessGoals = [
  "Kilo Kaybı",
  "Kas Kazanımı",
  "Dayanıklılık",
  "Genel Fitness",
  "Genel Fitness ve Güç Geliştirme",
  "Hedefe Özel Gelişim",
];

const ProgramGeneralForm: React.FC<ProgramGeneralFormProps> = ({
  programId,
  onSuccess,
}) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // ✅ useEffect always called
  useEffect(() => {
    if (!programId) {
      console.error("❌ programId is undefined in ProgramGeneralForm");
      setLoading(false);
      return;
    }

    const fetchProgram = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://kulvar-qb7t.onrender.com/programs/${programId}`, 

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProgram(res.data.program);
      } catch (error) {
        console.error("❌ Program verisi alınamadı:", error);
        console.log("📦 programId being fetched:", programId);

        toast.error("Program verisi alınamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [programId]);

  if (!programId) return <p>Program ID geçersiz.</p>;
  if (loading) return <p>Yükleniyor...</p>;
  if (!program) return <p>Program bulunamadı.</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProgram((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSelectChange = (key: keyof Program, value: string) => {
    setProgram((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async () => {
    if (!program) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/programs/${program._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(program),
        }
      );

      if (!res.ok) throw new Error("Sunucu hatası");

      toast.success("✅ Program başarıyla güncellendi.");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/coach");
      }
    } catch (err) {
      console.error("❌ Güncelleme hatası:", err);
      toast.error("Program güncellenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Program Adı</Label>
        <Input name="name" value={program.name} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          name="description"
          value={program.description}
          onChange={handleChange}
        />
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
        <Label>Zorluk Seviyesi</Label>
        <Select
          value={program.difficulty}
          onValueChange={(val) => handleSelectChange("difficulty", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seçin" />
          </SelectTrigger>
          <SelectContent>
            {difficultyOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Fitness Hedefi</Label>
        <Select
          value={program.fitnessGoal}
          onValueChange={(val) => handleSelectChange("fitnessGoal", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seçin" />
          </SelectTrigger>
          <SelectContent>
            {fitnessGoals.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {goal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Güncelleniyor..." : "Güncelle"}
      </Button>
    </div>
  );
};

export default ProgramGeneralForm;
