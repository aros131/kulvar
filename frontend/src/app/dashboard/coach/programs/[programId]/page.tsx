"use client";

import { useState } from "react";
import EditProgramForm from "@/components/coach/EditProgramForm";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Program } from "@/types/program";

export default function ProgramPage({ program }: { program: Program }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold">{program.name}</h1>
      <p>{program.description}</p>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsEditing(true)}>Düzenle</Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl">
          <EditProgramForm program={program} mode="edit" onSuccess={() => setIsEditing(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
