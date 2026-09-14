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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("programGeneralForm");
  const tp = useTranslations("programCreate");
  const difficultyLabels: Record<string, string> = {
    "Başlangıç": tp("difficultyBeginner"),
    "Orta Düzey": tp("difficultyIntermediate"),
    "İleri Seviye": tp("difficultyAdvanced"),
  };
  const goalLabels: Record<string, string> = {
    "Kilo Kaybı": tp("goalWeightLoss"),
    "Kas Kazanımı": tp("goalMuscleGain"),
    "Dayanıklılık": tp("goalEndurance"),
    "Genel Fitness": tp("goalGeneralFitness"),
    "Genel Fitness ve Güç Geliştirme": tp("goalGeneralFitnessStrength"),
    "Hedefe Özel Gelişim": tp("goalCustom"),
  };
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
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/programs/${programId}`, 

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProgram(res.data.program);
      } catch (error) {
        console.error("❌ Program verisi alınamadı:", error);
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [programId]);

  if (!programId) return <p>{t("invalidId")}</p>;
  if (loading) return <p>{t("loading")}</p>;
  if (!program) return <p>{t("notFound")}</p>;

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
        `${process.env.NEXT_PUBLIC_API_URL}/programs/${program._id}`,
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

      toast.success(t("updateSuccess"));

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/coach");
      }
    } catch (err) {
      console.error("❌ Güncelleme hatası:", err);
      toast.error(t("updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">{tp("programNameLabel")}</Label>
        <Input name="name" value={program.name} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="description">{tp("descriptionLabel")}</Label>
        <Textarea
          name="description"
          value={program.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="duration">{tp("durationLabel")}</Label>
        <Input
          name="duration"
          type="number"
          value={program.duration}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>{tp("difficultyLabel")}</Label>
        <Select
          value={program.difficulty}
          onValueChange={(val) => handleSelectChange("difficulty", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {difficultyOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {difficultyLabels[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{tp("goalLabel")}</Label>
        <Select
          value={program.fitnessGoal}
          onValueChange={(val) => handleSelectChange("fitnessGoal", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {fitnessGoals.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {goalLabels[goal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="priceCents">{tp("priceLabel")}</Label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
          <Input
            className="pl-7"
            type="number"
            min={0}
            step={1}
            placeholder={tp("pricePlaceholder")}
            value={program.priceCents != null ? program.priceCents / 100 : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Math.round(Number(e.target.value) * 100);
              setProgram((prev) => prev ? { ...prev, priceCents: val as any } : prev);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("priceHint")}</p>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t("updating") : t("update")}
      </Button>
    </div>
  );
};

export default ProgramGeneralForm;
