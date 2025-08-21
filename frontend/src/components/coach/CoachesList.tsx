"use client";

import Link from "next/link";

export type CoachListItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  city?: string;
  rating?: number | null;
  tagline?: string;
  specialties?: string[];
  programsCount?: number;
  isFollowing?: boolean;
};

export default function CoachesList({
  items,
  linkPrefix = "/koc",        // use "/uye/koc" for private area
  showFollowBadge = true,
}: {
  items: CoachListItem[];
  linkPrefix?: string;
  showFollowBadge?: boolean;
}) {
  if (!items?.length) {
    return <p className="text-muted-foreground">Şu anda listelenecek koç yok.</p>;
  }

  return (
    <ul className="divide-y rounded-md border bg-background">
      {items.map((c) => (
        <li key={c.id} className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            <img src={c.avatarUrl || "/images/user.png"} alt={c.name} className="h-full w-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{c.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {[c.city, c.tagline].filter(Boolean).join(" • ")}
            </div>
            {!!c.specialties?.length && (
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {c.specialties.slice(0, 3).join(" • ")}
                {c.specialties.length > 3 ? " +" + (c.specialties.length - 3) : ""}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {typeof c.rating === "number" && (
              <span className="text-xs text-muted-foreground">{c.rating.toFixed(1)}★</span>
            )}
            {typeof c.programsCount === "number" && (
              <span className="text-xs text-muted-foreground">{c.programsCount} program</span>
            )}
            <Link href={`${linkPrefix}/${c.id}`} className="text-sm underline underline-offset-4">
              Profili Aç
            </Link>
            {showFollowBadge && c.isFollowing && (
              <span className="text-[11px] rounded bg-secondary px-2 py-0.5">Takiptesin</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
