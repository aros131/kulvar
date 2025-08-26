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
};

const API = (process.env.NEXT_PUBLIC_API_URL ?? "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

export default function BookSessionButton({ coachId, label = "Randevu Al" }: BookSessionButtonProps) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [openOnMount, setOpenOnMount] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // #book ile geldiyse otomatik aç
    if (typeof window !== "undefined" && window.location.hash === "#book") {
      setOpenOnMount(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/profile`, {
          credentials: "include",
          cache: "no-store",
        });
        if (mounted) setAuthed(res.ok);
      } catch {
        if (mounted) setAuthed(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (authed === null) return <Button disabled>{label}</Button>;

  if (!authed) {
    const next = `${pathname}#book`; // dönüşte dialog otomatik açılsın
    return (
      <Button asChild size="lg">
        <Link href={`/signup?next=${encodeURIComponent(next)}`}>{label}</Link>
      </Button>
    );
  }

  // Girişliyse: diyalog açma butonu + hash geldiyse otomatik açık
  return <BookSession coachId={coachId} label={label} defaultOpen={openOnMount} />;
}
