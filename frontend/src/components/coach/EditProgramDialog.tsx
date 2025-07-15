"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProgramGeneralForm from "@/components/program/edit/ProgramGeneralForm";

interface EditProgramDialogProps {
  programId: string;
}

const EditProgramDialog: React.FC<EditProgramDialogProps> = ({ programId }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
          Düzenle
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Programı Düzenle</h2>
        <ProgramGeneralForm
          programId={programId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProgramDialog;
