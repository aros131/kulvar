// components/BookSessionButton.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BookSession from "./BookSession";

type BookSessionButtonProps = {
  coachId: string;
  label?: string;
  /** Üst componentten auth durumu gelirse direkt onu kullanırız */
  isAuthed?: boolean;
};

function cleanToken(): string | null {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    const val = trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
    return val && val.length >= 16 ? val : null;
  } catch {
    return null;
  }
}

export default function BookSessionButton({
  coachId,
  label = "Randevu Al",
  isAuthed: isAuthedProp,
}: BookSessionButtonProps) {
  const pathname = usePathname();
  const [openOnMount, setOpenOnMount] = useState(false);
  const [authed, setAuthed] = useState<boolean>(
    typeof isAuthedProp === "boolean" ? isAuthedProp : Boolean(cleanToken())
  );

  // #book ile gelindiyse dialogu otomatik aç
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#book") {
      setOpenOnMount(true);
    }
  }, []);

  // Parent prop değişirse güncelle
  useEffect(() => {
    if (typeof isAuthedProp === "boolean") setAuthed(isAuthedProp);
  }, [isAuthedProp]);

  // localStorage token değişimlerini yakala (başka tabda login/logout)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setAuthed(Boolean(cleanToken()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!authed) {
    const redirect = `${pathname}#book`;
    return (
      <Button asChild size="lg">
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
          {label}
        </Link>
      </Button>
    );
  }

  // Girişliyse: BookSession aç/kapat butonu (hash geldiyse otomatik açık)
  return <BookSession coachId={coachId} label={label} defaultOpen={openOnMount} />;
}
