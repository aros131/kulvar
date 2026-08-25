"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompleteSessionDialogProps {
  programId: string;
  day: number;
  sessionTitle: string;
  onCompleted?: () => void;
}

export default function CompleteSessionDialog({ programId, day, sessionTitle, onCompleted }: CompleteSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/${programId}/complete-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId, day, sessionTitle, feedback, rating }),
      });

      if (!res.ok) throw new Error("Tamamlama başarısız");

      toast.success("Seans başarıyla tamamlandı");
      setOpen(false);
      setFeedback("");
      setRating(0);
      onCompleted?.();
    } catch {
      toast.error("Seans tamamlarken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Seansı Tamamla</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bu seansı tamamladın mı?</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Görüşlerini yaz (isteğe bağlı)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mb-4"
        />

        <div className="mb-4">
          <label className="block mb-1">Puan (1-5):</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}