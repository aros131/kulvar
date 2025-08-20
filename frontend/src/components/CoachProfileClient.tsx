"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Button
} from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Star,
  MapPin,
  Clock,
  Check,
  MessageCircle,
  Calendar as CalendarIcon,
  Share2,
  MoreHorizontal,
  Languages,
  BadgeCheck,
  Users,
  ShieldCheck,
} from "lucide-react";

/************************************
 * Types
 ************************************/
export type Coach = {
  id: string;
  name: string;
  handle?: string; // e.g., @aren
  avatarUrl?: string;
  coverUrl?: string;
  role?: string; // e.g., Strength & Conditioning Coach
  location?: string; // e.g., Ankara, TR
  languages?: string[]; // e.g., ["TR", "EN"]
  tagline?: string;
  rating?: number; // 4.9
  reviewCount?: number; // 128
  clientsCount?: number; // 240
  avgResponseTime?: string; // "1h"
  specialties?: string[]; // ["Hypertrophy", "Mobility"]
  certifications?: string[]; // ["NASM-CPT", "Precision Nutrition L1"]
  bio?: string;
  socials?: { platform: "instagram" | "youtube" | "tiktok" | "x" | "website"; url: string }[];
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  durationWeeks?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  goal?: string; // e.g., "Fat Loss", "Hypertrophy"
  equipment?: string[];
  rating?: number;
  price?: number; // in TRY or display-ready string from backend
  image?: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number; // 1-5
  date: string; // ISO
  comment: string;
  keywords?: string[]; // ["nutrition", "posture"]
  verified?: boolean;
};

export type ReviewSummary = {
  average: number; // 4.8
  count: number; // 152
  distribution: { [stars: number]: number }; // {5:120,4:25,...}
  topKeywords?: string[];
  items?: Review[];
};

export type AvailabilitySlot = {
  time: string; // "10:00"
  available: boolean;
};

export type AvailabilityDay = {
  date: string; // "2025-08-21"
  slots: AvailabilitySlot[];
  timezone: string; // "Europe/Istanbul"
};

export type CoachProfileClientProps = {
  coach: Coach;
  programs?: Program[];
  reviews?: ReviewSummary;
  availability?: AvailabilityDay[]; // next 7–14 days suggested
  locale?: "tr" | "en";
  isFollowing?: boolean;
  isOwner?: boolean;
  loading?: boolean;
  onFollowToggle?: (next: boolean) => Promise<void> | void;
  onBook?: (payload: { day: string; time: string }) => Promise<void> | void;
  onMessage?: (coachId: string) => void;
};

/************************************
 * i18n (minimal, extend as needed)
 ************************************/
const STRINGS = {
  en: {
    follow: "Follow",
    following: "Following",
    message: "Message",
    book: "Book",
    share: "Share",
    overview: "Overview",
    programs: "Programs",
    progress: "Progress",
    reviews: "Reviews",
    availability: "Availability",
    about: "About",
    highlights: "Highlights",
    topProgram: "Top Program",
    latestTransformation: "Latest Transformation",
    recentPost: "Recent Post",
    promo: "Promo",
    readMore: "Read more",
    filter: "Filter",
    sort: "Sort",
    popular: "Popular",
    newest: "Newest",
    rating: "Rating",
    price: "Price",
    duration: "Duration",
    difficulty: "Difficulty",
    verified: "Verified",
    avg: "Avg",
    totalReviews: "total reviews",
    bookASession: "Book a session",
    selectSlot: "Select a slot",
    continue: "Continue",
    cancel: "Cancel",
    specialties: "Specializations",
    certifications: "Certifications",
    languages: "Languages",
    location: "Location",
    clients: "clients",
    response: "avg. response",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    report: "Report",
    emptyPrograms: "No programs yet — follow to get updates.",
  },
  tr: {
    follow: "Takip et",
    following: "Takiptesin",
    message: "Mesaj",
    book: "Randevu",
    share: "Paylaş",
    overview: "Genel Bakış",
    programs: "Programlar",
    progress: "İlerleme",
    reviews: "Yorumlar",
    availability: "Müsaitlik",
    about: "Hakkında",
    highlights: "Öne Çıkanlar",
    topProgram: "Öne Çıkan Program",
    latestTransformation: "Son Dönüşüm",
    recentPost: "Güncel Paylaşım",
    promo: "Kampanya",
    readMore: "Devamını oku",
    filter: "Filtre",
    sort: "Sırala",
    popular: "Popüler",
    newest: "En yeni",
    rating: "Puan",
    price: "Fiyat",
    duration: "Süre",
    difficulty: "Zorluk",
    verified: "Doğrulandı",
    avg: "Ort",
    totalReviews: "toplam yorum",
    bookASession: "Seans ayır",
    selectSlot: "Saat seç",
    continue: "Devam",
    cancel: "İptal",
    specialties: "Uzmanlıklar",
    certifications: "Sertifikalar",
    languages: "Diller",
    location: "Konum",
    clients: "müşteri",
    response: "ort. yanıt",
    copyLink: "Linki kopyala",
    linkCopied: "Link kopyalandı",
    report: "Şikayet et",
    emptyPrograms: "Henüz program yok — güncellemeleri almak için takip et.",
  },
} satisfies Record<string, Record<string, string>>;

const cx = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");

/************************************
 * Sticky section nav (scroll-spy)
 ************************************/
const SECTIONS = ["overview", "programs", "progress", "reviews", "availability", "about"] as const;

export default function CoachProfileClient({
  coach,
  programs = [],
  reviews,
  availability = [],
  locale = "tr",
  isFollowing: isFollowingProp = false,
  isOwner = false,
  loading = false,
  onFollowToggle,
  onBook,
  onMessage,
}: CoachProfileClientProps) {
  const t = STRINGS[locale] ?? STRINGS.tr;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("overview");
  const [scrolled, setScrolled] = useState(false);
  const [isFollowing, setIsFollowing] = useState(isFollowingProp);
  const [booking, setBooking] = useState<{ day?: string; time?: string }>({});
  const [bookingOpen, setBookingOpen] = useState(false);

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

  const openBooking = (day: string, time?: string) => {
    setBooking({ day, time });
    setBookingOpen(true);
  };

  const confirmBooking = async () => {
    if (!booking.day || !booking.time) return;
    try {
      await onBook?.({ day: booking.day, time: booking.time });
      setBookingOpen(false);
      toast.success(locale === "tr" ? "Randevu ayrıldı" : "Session booked");
    } catch (e) {
      toast.error(locale === "tr" ? "Randevu alınamadı" : "Could not book");
    }
  };

  if (loading) return <CoachProfileSkeleton />;

  return (
    <div ref={rootRef} className="relative min-h-screen">
      {/* Cover / Header background */}
      <div className="absolute inset-x-0 top-0 h-[260px] bg-gradient-to-br from-primary/25 via-muted to-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      {/* Sticky Top Bar */}
      <div className={cx(
        "sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all",
        scrolled ? "border-b border-border" : ""
      )}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={coach.avatarUrl} alt={coach.name} />
                <AvatarFallback>{coach.name?.slice(0,2)?.toUpperCase() ?? "C"}</AvatarFallback>
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
              <Button size="sm" variant="outline" onClick={handleMessage}><MessageCircle className="mr-2 h-4 w-4" />{t.message}</Button>
              <Button size="sm" onClick={() => openBooking(availability?.[0]?.date || new Date().toISOString().slice(0,10))}><CalendarIcon className="mr-2 h-4 w-4" />{t.book}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}><Share2 className="mr-2 h-4 w-4" />{t.copyLink}</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive"><ShieldCheck className="mr-2 h-4 w-4" />{t.report}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                className={cx(
                  "relative py-2",
                  active === id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="capitalize">{(t as any)[id] ?? id}</span>
                <span className={cx(
                  "absolute left-0 right-0 -bottom-[1px] h-[2px] rounded bg-primary transition-opacity",
                  active === id ? "opacity-100" : "opacity-0"
                )} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <Avatar className="h-28 w-28 ring-4 ring-background shadow-md">
              <AvatarImage src={coach.avatarUrl} alt={coach.name} />
              <AvatarFallback className="text-xl">{coach.name?.slice(0,2)?.toUpperCase() ?? "C"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{coach.name}</h1>
                <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />{t.verified}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{coach.role}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {coach.location && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{coach.location}</span>
                )}
                {coach.languages?.length ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Languages className="h-4 w-4" />{coach.languages.join(" · ")}</span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />{coach.rating?.toFixed(1) ?? "-"} ({coach.reviewCount ?? 0})</span>
                {typeof coach.clientsCount === "number" && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" />{coach.clientsCount} {t.clients}</span>
                )}
                {coach.avgResponseTime && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{coach.avgResponseTime} {t.response}</span>
                )}
              </div>
              {coach.tagline && (
                <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">{coach.tagline}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {(coach.specialties ?? []).slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="mx-auto max-w-6xl px-4 pt-8 md:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle>{t.highlights}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HighlightCard title={t.topProgram} image={(programs[0]?.image) || "/images/panel-program-lg.jpg"} subtitle={programs[0]?.name ?? "—"} />
                <HighlightCard title={t.latestTransformation} image="/images/placeholder-transformation.jpg" subtitle={locale === "tr" ? "-12 kg / 16 hafta" : "-12kg / 16 weeks"} />
                <HighlightCard title={t.recentPost} image="/images/placeholder-post.jpg" subtitle={locale === "tr" ? "Omuz mobilitesi ipuçları" : "Shoulder mobility tips"} />
                <HighlightCard title={t.promo} image="/images/placeholder-promo.jpg" subtitle={locale === "tr" ? "%20 indirim – Bu hafta" : "20% off – This week"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.reviews}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewSummaryBlock summary={reviews} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="mx-auto max-w-6xl px-4 pt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.programs}</h2>
          <div className="flex items-center gap-2 text-sm">
            <Button variant="outline" size="sm">{t.filter}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">{t.sort}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{t.popular}</DropdownMenuItem>
                <DropdownMenuItem>{t.newest}</DropdownMenuItem>
                <DropdownMenuItem>{t.rating}</DropdownMenuItem>
                <DropdownMenuItem>{t.price}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">{t.emptyPrograms}</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((p) => (
              <ProgramCard key={p.id} p={p} locale={locale} onBook={() => openBooking(availability?.[0]?.date || new Date().toISOString().slice(0,10))} />
            ))}
          </div>
        )}
      </section>

      {/* Progress (Coach-facing preview or user public stats) */}
      <section id="progress" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-4 text-xl font-semibold">{t.progress}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={76} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">76-day streak • PRs up 12%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>PRs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Deadlift +20kg • 5K -0:48</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={92} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">92% last 30 days</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-4 text-xl font-semibold">{t.reviews}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <ReviewSummaryBlock summary={reviews} locale={locale} compact={false} />
            </CardContent>
          </Card>
          <div className="md:col-span-2 space-y-4">
            {(reviews?.items ?? demoReviews).slice(0, 6).map((r) => (
              <ReviewRow key={r.id} r={r} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Availability & Booking */}
      <section id="availability" className="mx-auto max-w-6xl px-4 pt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t.availability}</h2>
          <Button onClick={() => openBooking(availability?.[0]?.date || new Date().toISOString().slice(0,10))}><CalendarIcon className="mr-2 h-4 w-4" />{t.bookASession}</Button>
        </div>
        <AvailabilityGrid days={availability} onPick={(day, time) => openBooking(day, time)} />
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
                  <div className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.certifications}</div>
                  <div className="flex flex-wrap gap-2">
                    {coach.certifications.map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {coach.location ? (
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /><span className="text-muted-foreground">{t.location}:</span><span>{coach.location}</span></div>
              ) : null}
              {coach.languages?.length ? (
                <div className="flex items-center gap-2 text-sm"><Languages className="h-4 w-4" /><span className="text-muted-foreground">{t.languages}:</span><span>{coach.languages.join(", ")}</span></div>
              ) : null}
              {coach.specialties?.length ? (
                <div>
                  <div className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.specialties}</div>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.bookASession}</DialogTitle>
            <DialogDescription>{t.selectSlot}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <AvailabilityGrid days={availability} selected={{ day: booking.day, time: booking.time }} onPick={(day, time) => setBooking({ day, time })} compact />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>{t.cancel}</Button>
            <Button disabled={!booking.day || !booking.time} onClick={confirmBooking}>{t.continue}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/************************************
 * Subcomponents
 ************************************/
function HighlightCard({ title, subtitle, image }: { title: string; subtitle?: string; image: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/9]">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="font-medium">{subtitle || "—"}</div>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ p, onBook, locale = "tr" }: { p: Program; onBook?: () => void; locale?: "tr" | "en" }) {
  const t = STRINGS[locale] ?? STRINGS.tr;
  return (
    <Card className="group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[16/10]">
        <Image src={p.image || "/images/panel-program-sm.jpg"} alt={p.name} fill className="object-cover transition group-hover:scale-[1.03]" />
        {p.rating ? (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs shadow"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{p.rating.toFixed(1)}</div>
        ) : null}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{p.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm text-muted-foreground space-y-2">
        <p className="line-clamp-2">{p.description}</p>
        <div className="flex flex-wrap gap-2">
          {p.difficulty && <Badge variant="outline">{p.difficulty}</Badge>}
          {typeof p.durationWeeks === "number" && <Badge variant="outline">{p.durationWeeks}w</Badge>}
          {p.goal && <Badge variant="outline">{p.goal}</Badge>}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="font-medium text-foreground">{typeof p.price === "number" ? `${Intl.NumberFormat(locale, { style: "currency", currency: locale === "tr" ? "TRY" : "USD" }).format(p.price)}` : p.price ?? ""}</div>
          <Button size="sm" onClick={onBook}><CalendarIcon className="mr-2 h-4 w-4" />{t.book}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewSummaryBlock({ summary, locale = "tr", compact = true }: { summary?: ReviewSummary; locale?: "tr" | "en"; compact?: boolean }) {
  const t = STRINGS[locale] ?? STRINGS.tr;
  const avg = summary?.average ?? 0;
  const count = summary?.count ?? 0;
  const dist = summary?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxCount = Math.max(...Object.values(dist));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="text-3xl font-semibold">{avg.toFixed(1)}</div>
        <div className="text-muted-foreground text-sm">{count} {t.totalReviews}</div>
      </div>
      <div className="space-y-2">
        {[5,4,3,2,1].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center w-10 text-sm text-muted-foreground">
              <Star className="mr-1 h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />{s}
            </div>
            <div className="h-2 flex-1 rounded bg-muted overflow-hidden">
              <div className="h-2 bg-primary" style={{ width: `${maxCount ? (dist[s] / maxCount) * 100 : 0}%` }} />
            </div>
            <div className="w-8 text-right text-xs text-muted-foreground">{dist[s] ?? 0}</div>
          </div>
        ))}
      </div>
      {!compact && summary?.topKeywords?.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {summary.topKeywords.map((k) => (
            <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReviewRow({ r, locale = "tr" }: { r: Review; locale?: "tr" | "en" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarFallback>{r.author.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
            <div className="text-sm font-medium">{r.author}</div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />{r.rating.toFixed(1)}</div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(r.keywords ?? []).map((k) => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}
          {r.verified && <Badge variant="secondary" className="gap-1 text-xs"><BadgeCheck className="h-3.5 w-3.5" />Verified</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function AvailabilityGrid({ days = [], onPick, selected, compact = false }: { days?: AvailabilityDay[]; onPick?: (day: string, time: string) => void; selected?: { day?: string; time?: string }; compact?: boolean }) {
  if (!days.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">—</CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {days.map((d) => (
        <Card key={d.date} className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</CardTitle>
            <div className="text-xs text-muted-foreground">{d.timezone}</div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {d.slots.map((s, idx) => {
                const isSel = selected?.day === d.date && selected?.time === s.time;
                return (
                  <button
                    key={idx}
                    disabled={!s.available}
                    onClick={() => s.available && onPick?.(d.date, s.time)}
                    className={cx(
                      "rounded-md border px-3 py-1.5 text-sm transition",
                      !s.available && "opacity-50 cursor-not-allowed",
                      isSel ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    )}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

/************************************
 * Demo content (safe fallbacks)
 ************************************/
const demoReviews: Review[] = [
  { id: "r1", author: "A. Kaya", rating: 5, date: "2025-06-01", comment: "Programlar çok düzenli ve takip etmesi kolay. Beslenme önerileri de harika.", keywords: ["nutrition", "discipline"], verified: true },
  { id: "r2", author: "D. Yılmaz", rating: 4.5, date: "2025-05-12", comment: "Omuz mobilitesinde ciddi ilerleme yaşadım. Tavsiye ederim.", keywords: ["mobility", "shoulder"], verified: true },
  { id: "r3", author: "E. Demir", rating: 4.8, date: "2025-04-29", comment: "İletişim çok hızlı. Programlar kişiye özel hissettiriyor.", keywords: ["communication"], verified: true },
  { id: "r4", author: "S. Aydın", rating: 5, date: "2025-04-02", comment: "16 haftada harika dönüşüm. Teşekkürler!", keywords: ["transformation"], verified: true },
  { id: "r5", author: "B. Öz", rating: 4.9, date: "2025-03-18", comment: "Postürüm düzeldi, ağrılarım azaldı.", keywords: ["posture"], verified: true },
  { id: "r6", author: "C. Koç", rating: 4.7, date: "2025-02-11", comment: "Koç çok ilgili, seanslar verimli geçti.", keywords: ["coaching"], verified: true },
];
