// components/CoachProfileClient.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Star, MapPin, Check, MessageCircle, Share2, BadgeCheck, Users } from "lucide-react";

/************************************
 * Types (trimmed for v1 scope)
 ************************************/
export type Coach = {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string; // ONLY image we keep
  role?: string;
  location?: string;
  tagline?: string;
  rating?: number;
  reviewCount?: number;
  clientsCount?: number;
  specialties?: string[];
  certifications?: string[];
  bio?: string;
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  durationWeeks?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  goal?: string;
  price?: number | string;
  // image removed for text-only UI
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string; // ISO
  comment: string;
  keywords?: string[];
  verified?: boolean;
};

export type CoachProfileClientProps = {
  coach: Coach;
  programs?: Program[];
  reviews?: Review[];
  locale?: "tr" | "en";
  isFollowing?: boolean;
  loading?: boolean;
  onFollowToggle?: (next: boolean) => Promise<void> | void;
  onMessage?: (coachId: string) => void;
};

/************************************
 * i18n (only what we use in v1)
 ************************************/
const STRINGS = {
  en: {
    follow: "Follow",
    following: "Following",
    message: "Message",
    share: "Share",
    overview: "Overview",
    programs: "Programs",
    reviews: "Reviews",
    about: "About",
    verified: "Verified",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    emptyPrograms: "No programs yet — follow to get updates.",
    totalReviews: "Total Reviews",
    avgRating: "Average Rating",
    activeClients: "Active Clients",
  },
  tr: {
    follow: "Takip et",
    following: "Takiptesin",
    message: "Mesaj",
    share: "Paylaş",
    overview: "Genel Bakış",
    programs: "Programlar",
    reviews: "Yorumlar",
    about: "Hakkında",
    verified: "Doğrulandı",
    copyLink: "Linki kopyala",
    linkCopied: "Link kopyalandı",
    emptyPrograms: "Henüz program yok — güncellemeleri almak için takip et.",
    totalReviews: "Toplam Yorum",
    avgRating: "Ortalama Puan",
    activeClients: "Aktif Müşteri",
  },
} satisfies Record<string, Record<string, string>>;

const cx = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");

/************************************
 * Sections (v1 = text-only)
 ************************************/
const SECTIONS = ["overview", "programs", "reviews", "about"] as const;

export default function CoachProfileClient({
  coach,
  programs = [],
  reviews = [],            // no mock data
  locale = "tr",
  isFollowing: isFollowingProp = false,
  loading = false,
  onFollowToggle,
  onMessage,
}: CoachProfileClientProps) {
  const t = STRINGS[locale] ?? STRINGS.tr;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("overview");
  const [scrolled, setScrolled] = useState(false);

  // local state for optimistic UI
  const [isFollowing, setIsFollowing] = useState(isFollowingProp);

  // 🔧 SYNC: when the parent (ClientBridge) discovers the true follow
  // state and re-renders, pick up that change.
  useEffect(() => {
    setIsFollowing(isFollowingProp);
  }, [isFollowingProp]);

  // observe scroll for sticky top bar & active section
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionEls = SECTIONS.map((id) => document.getElementById(id));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id && SECTIONS.includes(visible.target.id as any)) {
          setActive(visible.target.id as any);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    sectionEls.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72; // adjust for sticky bar
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const handleFollow = async () => {
    const next = !isFollowing;
    setIsFollowing(next); // optimistic
    try {
      await onFollowToggle?.(next);
      toast.success(next ? (locale === "tr" ? "Takip edildi" : "Followed") : (locale === "tr" ? "Takipten çıkıldı" : "Unfollowed"));
    } catch (e) {
      setIsFollowing(!next);
      toast.error(locale === "tr" ? "Bir hata oluştu" : "Something went wrong");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t.linkCopied);
    } catch {
      toast.message(t.copyLink);
    }
  };

  const handleMessage = () => {
    if (onMessage) return onMessage(coach.id);
    router.push(`/messages?to=${coach.id}`);
  };

  if (loading) return <CoachProfileSkeleton />;

  return (
    <div ref={rootRef} className="relative min-h-screen">
      {/* Cover / Header background (kept as CSS gradient, not an image) */}
      <div className="absolute inset-x-0 top-0 h-[260px] bg-gradient-to-br from-primary/25 via-muted to-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      {/* Sticky Top Bar */}
      <div
        className={cx(
          "sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all",
          scrolled ? "border-b border-border" : ""
        )}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={coach.avatarUrl} alt={coach.name} />
                <AvatarFallback>{coach.name?.slice(0, 2)?.toUpperCase() ?? "C"}</AvatarFallback>
              </Avatar>
              <div className="truncate">
                <div className="text-sm font-medium leading-none truncate">{coach.name}</div>
                <div className="text-xs text-muted-foreground truncate">{coach.role ?? "Coach"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={isFollowing ? "secondary" : "default"} onClick={handleFollow}>
                {isFollowing ? <Check className="mr-2 h-4 w-4" /> : null}
                {isFollowing ? t.following : t.follow}
              </Button>
              <Button size="sm" variant="outline" onClick={handleMessage}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {t.message}
              </Button>
              <Button size="icon" variant="ghost" onClick={handleShare} aria-label={t.share}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky section tabs */}
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar text-sm">
            {SECTIONS.map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cx("relative py-2", active === id ? "text-foreground" : "text-muted-foreground")}
              >
                <span className="capitalize">{(t as any)[id] ?? id}</span>
                <span
                  className={cx(
                    "absolute left-0 right-0 -bottom-[1px] h-[2px] rounded bg-primary transition-opacity",
                    active === id ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Hero (ONLY profile photo retained) */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <Avatar className="h-28 w-28 ring-4 ring-background shadow-md">
              <AvatarImage src={coach.avatarUrl} alt={coach.name} />
              <AvatarFallback className="text-xl">
                {coach.name?.slice(0, 2)?.toUpperCase() ?? "C"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{coach.name}</h1>
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t.verified}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{coach.role}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {coach.location && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {coach.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  {typeof coach.rating === "number" ? coach.rating.toFixed(1) : "-"} ({coach.reviewCount ?? 0})
                </span>
                {typeof coach.clientsCount === "number" && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {coach.clientsCount} {locale === "tr" ? "müşteri" : "clients"}
                  </span>
                )}
              </div>
              {coach.tagline && (
                <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">{coach.tagline}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {(coach.specialties ?? []).slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview (text-only stats) */}
      <section id="overview" className="mx-auto max-w-6xl px-4 pt-8 md:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-3">
            <CardHeader>
              <CardTitle>{t.overview}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">{coach.reviewCount ?? 0}</div>
                <div>{t.totalReviews}</div>
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {typeof coach.rating === "number" ? coach.rating.toFixed(1) : "-"}
                </div>
                <div>{t.avgRating}</div>
              </div>
              <div>
                <div className="font-medium text-foreground">{coach.clientsCount ?? "-"}</div>
                <div>{t.activeClients}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Programs (text-only) */}
      <section id="programs" className="mx-auto max-w-6xl px-4 pt-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.programs}</h2>
        </div>
        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t.emptyPrograms}
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y rounded-md border">
            {programs.map((p) => (
              <li key={p.id} className="p-4">
                <div className="font-medium">{p.name}</div>
                {p.description ? (
                  <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-1">
                  {p.durationWeeks ? `${p.durationWeeks} hafta` : ""}
                  {p.difficulty ? ` • ${p.difficulty}` : ""}
                  {p.goal ? ` • ${p.goal}` : ""}
                  {p.price != null
                    ? ` • ${
                        typeof p.price === "number"
                          ? Intl.NumberFormat(locale, {
                              style: "currency",
                              currency: locale === "tr" ? "TRY" : "USD",
                            }).format(p.price)
                          : p.price
                      }`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reviews (text-only) */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-4 text-xl font-semibold">{t.reviews}</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">—</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 8).map((r) => (
              <ReviewRow key={r.id} r={r} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 pt-12 pb-24">
        <h2 className="mb-4 text-xl font-semibold">{t.about}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="pt-6 space-y-4">
              {coach.bio ? (
                <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
              {coach.certifications?.length ? (
                <div>
                  <div className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {locale === "tr" ? "Sertifikalar" : "Certifications"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.certifications.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {coach.location ? (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    {locale === "tr" ? "Konum" : "Location"}:
                  </span>
                  <span>{coach.location}</span>
                </div>
              ) : null}
              {coach.specialties?.length ? (
                <div>
                  <div className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {locale === "tr" ? "Uzmanlıklar" : "Specializations"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

/************************************
 * Subcomponents (text-only)
 ************************************/
function ReviewRow({ r, locale = "tr" }: { r: Review; locale?: "tr" | "en" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{r.author.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium">{r.author}</div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm">
            <Star className="h-4 w-4" />
            {r.rating.toFixed(1)}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(r.keywords ?? []).map((k) => (
            <Badge key={k} variant="outline" className="text-xs">
              {k}
            </Badge>
          ))}
          {r.verified && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <BadgeCheck className="h-3.5 w-3.5" />
              {locale === "tr" ? "Doğrulanmış" : "Verified"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CoachProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="h-24" />
      </Card>
    </div>
  );
}
