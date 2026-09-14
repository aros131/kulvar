"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import ProgramGeneralForm from "@/components/program/edit/ProgramGeneralForm";

interface EditProgramDialogProps {
  programId: string;
  onUpdated?: () => void | Promise<void>; // ✅ Added
}

const EditProgramDialog: React.FC<EditProgramDialogProps> = ({
  programId,
  onUpdated,
}) => {
  const t = useTranslations("editProgramDialog");
  const [open, setOpen] = useState(false);

  if (!programId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
          {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>
          {t("subtitle")}
        </DialogDescription>

        <ProgramGeneralForm
          programId={programId}
          onSuccess={async () => {
            if (onUpdated) await onUpdated(); // ✅ Refetch list
            setOpen(false); // ✅ Close dialog
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProgramDialog;
