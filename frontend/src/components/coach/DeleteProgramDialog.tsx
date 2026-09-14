"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface DeleteProgramDialogProps {
  programId: string;
  programName: string; // 🆕 silme onayı için eklendi
  onDelete: () => void;
}

export default function DeleteProgramDialog({
  programId,
  programName,
  onDelete,
}: DeleteProgramDialogProps) {
  const t = useTranslations("deleteProgramDialog");
  const handleDelete = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/${programId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        alert(t("deleted"));
        onDelete(); // refresh parent list
      }
    } catch (err) {
      console.error("❌ Silme hatası:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-red-500 text-white px-3 py-1 rounded">{t("deleteButton")}</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <p>{t.rich("confirmText", { name: programName, b: (chunks) => <strong>{chunks}</strong> })}</p>
        <DialogFooter className="mt-4">
          <Button variant="outline">{t("cancel")}</Button>
          <Button variant="destructive" onClick={handleDelete}>
            {t("deleteButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
