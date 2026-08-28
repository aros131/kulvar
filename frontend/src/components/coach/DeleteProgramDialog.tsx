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
  const handleDelete = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/${programId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        alert("✅ Program silindi.");
        onDelete(); // üst listeyi refreshle
      }
    } catch (err) {
      console.error("❌ Silme hatası:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-red-500 text-white px-3 py-1 rounded">Sil</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programı Sil</DialogTitle>
        </DialogHeader>
        <p>
          <strong>{programName}</strong> adlı programı silmek istediğinizden emin
          misiniz?
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline">Vazgeç</Button>
          <Button variant="destructive" onClick={handleDelete}>
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
