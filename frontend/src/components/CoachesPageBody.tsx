"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Star, Heart, ChevronDown, SlidersHorizontal,
  ArrowUpDown, X, Award,
} from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const SPEC_VALUES = ["yoga", "fitness", "pilates", "beslenme"] as const;

const SPEC_COLOR: Record<string, string> = {
  yoga:     "bg-violet-100 text-violet-700",
  fitness:  "bg-orange-100 text-orange-700",
  pilates:  "bg-pink-100   text-pink-700",
  beslenme: "bg-green-100  text-green-700",
};

type SpecValue = (typeof SPEC_VALUES)[number];
type SortKey   = "rating" | "price_asc" | "price_desc" | "newest";

type Coach = {
  _id: string;
  name: string;
  role?: string;
  avatar?: string;
  profilePicture?: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  bio?: string;
  tagline?: string;
  certifications?: string[];
  programsCount?: number;
  price?: number | null;
  createdAt?: string;
  verified?: boolean;
};

/* ── Helpers ──────────────────────────────────────── */
const toTRLower   = (s: string) => s.toLocaleLowerCase("tr");
const toArray     = (x?: string | string[]) => (!x ? [] : Array.isArray(x) ? x : [x]);
const allowedSpec = new Set<SpecValue>(SPEC_VALUES);

const normalizeSpec = (s: string): SpecValue | "" => {
  const v = toTRLower(s) as SpecValue;
  return allowedSpec.has(v) ? v : "";
};

/** Her kelimenin baş harfini büyük yap (Türkçe uyumlu) */
const capitalizeName = (name?: string) => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

function initials(name: string | undefined, fallback: string) {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || fallback;
}

function specColor(spec: string) {
  return SPEC_COLOR[toTRLower(spec)] || "bg-muted text-muted-foreground";
}

function photoUrl(c: Coach) {
  const raw = c.profilePicture || c.avatar || "";
  if (!raw || raw.startsWith("/images/default")) return "";
  return raw;
}

/* ── Favourite helpers (localStorage) ────────────── */
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem("coach_favs") || "[]")); } catch { return new Set(); }
}
function saveFavs(s: Set<string>) {
  try { localStorage.setItem("coach_favs", JSON.stringify([...s])); } catch {}
}

/* ── Sorting ──────────────────────────────────────── */
function sortCoaches(list: Coach[], key: SortKey): Coach[] {
  const copy = [...list];
  if (key === "rating")     return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (key === "price_asc")  return copy.sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
  if (key === "price_desc") return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  if (key === "newest")     return copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return copy;
}

/* ── Component ────────────────────────────────────── */
export default function CoachesPageBody() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("coachesDirectory");

  const specLabels: Record<SpecValue, string> = {
    yoga: t("specLabels.yoga"),
    fitness: t("specLabels.fitness"),
    pilates: t("specLabels.pilates"),
    beslenme: t("specLabels.beslenme"),
  };

  const [query,      setQuery]      = useState((searchParams?.get("q")    || "").trim());
  const [specFilter, setSpecFilter] = useState<SpecValue | "">(normalizeSpec(searchParams?.get("spec") || ""));
  const [sortKey,    setSortKey]    = useState<SortKey>("rating");
  const [minRating,  setMinRating]  = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [raw,     setRaw]     = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching,setFetching]= useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => { setFavs(loadFavs()); }, []);

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  };

  /* sync URL */
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query)      sp.set("q",    query);
    if (specFilter) sp.set("spec", specFilter);
    router.replace(`/koc?${sp.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, specFilter]);

  /* fetch */
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const items = await fetchCoaches(query, specFilter);
      if (!active) return;
      setRaw(items ?? []);
      setError(items ? null : t('errorFetch'));
      setLoading(false);
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      setFetching(true);
      const items = await fetchCoaches(query, specFilter);
      setRaw(items ?? []);
      setError(items ? null : t('errorSearch'));
      setFetching(false);
    }, 380);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, specFilter]);

  /* derived list */
  const coaches = useMemo(() => {
    let list = raw;
    if (minRating > 0) list = list.filter((c) => (c.rating ?? 0) >= minRating);
    if (verifiedOnly) list = list.filter((c) => c.verified);
    return sortCoaches(list, sortKey);
  }, [raw, sortKey, minRating, verifiedOnly]);

  const SORT_LABELS: Record<SortKey, string> = {
    rating:     t('sortLabels.rating'),
    price_asc:  t('sortLabels.price_asc'),
    price_desc: t('sortLabels.price_desc'),
    newest:     t('sortLabels.newest'),
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ─────────────────────────────────────── */}
      <div className="bg-primary px-6 pt-14 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs tracking-[0.2em] text-primary-foreground/60 mb-3">PERSE COACHING</p>
          <h1 className="text-4xl md:text-6xl font-black text-primary-foreground leading-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-primary-foreground/70 mb-8 text-sm md:text-base">
            {t('heroSubtitle')}
          </p>
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none shadow-lg"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ────────────────────────── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">

          {/* Spec pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSpecFilter("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                specFilter === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t('specAll')}
            </button>
            {SPEC_VALUES.map((value) => (
              <button
                key={value}
                onClick={() => setSpecFilter(specFilter === value ? "" : value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  specFilter === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {specLabels[value]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {SORT_LABELS[sortKey]}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-xl z-40 py-1 overflow-hidden">
                  {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => { setSortKey(k); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors ${sortKey === k ? "text-primary font-semibold" : "text-foreground"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Min rating */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-transparent outline-none text-xs cursor-pointer"
              >
                <option value={0}>{t('ratingAll')}</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>

            {/* Verified only */}
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                verifiedOnly ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              {t('verifiedFilter')}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">

        {/* Meta row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading || fetching
              ? t('loadingText')
              : coaches.length === 0
              ? t('noResults')
              : t('resultsCount', { count: coaches.length })}
          </p>
          {fetching && <div className="h-1 w-24 rounded-full bg-primary/20 overflow-hidden"><div className="h-full w-1/2 bg-primary animate-pulse rounded-full" /></div>}
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : error && coaches.length === 0 ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="rounded-2xl border border-border p-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">{t('errorNoMatch')}</p>
            <button onClick={() => { setQuery(""); setSpecFilter(""); setMinRating(0); setVerifiedOnly(false); }} className="mt-4 text-xs text-primary underline">{t('clearFilters')}</button>
          </div>
        ) : (
          /* Masonry-style: CSS columns */
          <div className="columns-2 lg:columns-3 gap-4 space-y-4">
            {coaches.map((c) => (
              <CoachCard
                key={c._id}
                coach={c}
                isFav={favs.has(c._id)}
                isHovered={hovered === c._id}
                onToggleFav={toggleFav}
                onHover={setHovered}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Coach Card ───────────────────────────────────── */
function CoachCard({
  coach: c, isFav, isHovered, onToggleFav, onHover, t,
}: {
  coach: Coach;
  isFav: boolean;
  isHovered: boolean;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const photo  = photoUrl(c);
  const specs  = toArray(c.specialization).slice(0, 3);
  const name   = capitalizeName(c.name);
  const hasRating = typeof c.rating === "number" && c.rating > 0;

  return (
    <div className="break-inside-avoid mb-5">
      <Link href={`/koc/${c._id}`} prefetch={false} className="block group">
        <div
          className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
          onMouseEnter={() => onHover(c._id)}
          onMouseLeave={() => onHover(null)}
        >
          {/* ── Photo area ── */}
          <div className="relative w-full" style={{ paddingBottom: "72%" }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-5xl font-black text-primary/30 select-none">{initials(c.name, t('initialsFallback'))}</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />

            {/* Favourite button */}
            <button
              onClick={(e) => onToggleFav(c._id, e)}
              aria-label={isFav ? t('favRemove') : t('favAdd')}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow transition hover:scale-110"
            >
              <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-rose-500 text-rose-500" : "text-foreground/60"}`} />
            </button>

            {/* Verified badge */}
            {c.verified && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                <Award className="h-3 w-3" /> {t('verifiedFilter')}
              </div>
            )}

          </div>

          {/* ── Info area ── */}
          <div className="p-2.5 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm md:text-base text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                  {name}
                </h3>
                {c.city && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" /> {c.city}
                  </p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {hasRating ? c.rating!.toFixed(1) : t('newBadge')}
                </span>
                {c.price != null && (
                  <span className="text-xs text-muted-foreground font-medium">{t('perMonth', { price: c.price })}</span>
                )}
              </div>
            </div>

            {/* Specialization chips */}
            <div className="flex flex-wrap gap-1 mt-2 min-h-[22px]">
              {specs.length > 0 ? specs.map((s) => (
                <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${specColor(s)}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                </span>
              )) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground/50 border border-dashed border-border">
                  {t('specNotSet')}
                </span>
              )}
            </div>

            {/* Hover preview: bio snippet. Always rendered at the same fixed
                height (even with no content) so every card in the masonry
                grid stays the same size — only opacity fades on hover, never
                height, so hovering can't reshuffle the cards below it. */}
            <div className="mt-3 h-12 overflow-hidden">
              {(c.bio || c.tagline || c.certifications?.length) && (
                <p className={`text-xs text-muted-foreground transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"} ${c.tagline && !c.bio ? "italic" : ""} line-clamp-3`}>
                  {c.bio || c.tagline || `🏅 ${c.certifications!.slice(0, 2).join(" · ")}`}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              {c.programsCount != null && c.programsCount > 0 ? (
                <span className="text-xs text-muted-foreground">{t('programsCount', { count: c.programsCount })}</span>
              ) : <span />}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2.5 transition-all">
                {t('viewProfileArrow')}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="columns-2 lg:columns-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="break-inside-avoid mb-5 rounded-3xl overflow-hidden border border-border bg-card">
          <Skeleton className="w-full" style={{ paddingBottom: "72%", display: "block" }} />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Data helpers ─────────────────────────────────── */
async function fetchCoaches(q: string, spec: SpecValue | ""): Promise<Coach[] | null> {
  const build = (key?: string) => {
    const p = new URLSearchParams();
    if (key && q) p.set(key, q);
    if (spec) p.set("spec", spec);
    const qs = p.toString();
    return `${API}/coaches${qs ? `?${qs}` : ""}`;
  };

  const urls = q
    ? [build("search"), build("q"), build("name"), build()]
    : [build()];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = await res.json().catch(() => ({}));
      const items: any[] =
        (Array.isArray(json?.coaches)       && json.coaches)       ||
        (Array.isArray(json?.data?.coaches) && json.data.coaches)  ||
        (Array.isArray(json?.results)       && json.results)       ||
        (Array.isArray(json)                && json)               ||
        [];
      return items.filter((it) => toTRLower(String(it?.role ?? "coach")) === "coach");
    } catch { continue; }
  }
  return null;
}
