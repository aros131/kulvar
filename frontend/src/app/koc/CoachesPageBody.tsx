"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Star, Dumbbell, Loader2, Filter } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type Coach = {
  _id: string;
  name: string;
  role?: string; // used for final client-side filter
  avatar?: string;
  profilePicture?: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  bio?: string;
  programsCount?: number;
};

export default function CoachesPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = (searchParams?.get("q") || "").trim();
  const initialSpec = (searchParams?.get("spec") || "").trim();
  const debug = searchParams?.get("debug") === "1";

  const [query, setQuery] = useState<string>(initialQuery);
  const [specFilter, setSpecFilter] = useState<string>(initialSpec);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // raw fetched list (only coaches), and the filtered list to render
  const [coachesRaw, setCoachesRaw] = useState<Coach[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  const [debugInfo, setDebugInfo] = useState<{ url?: string; status?: number; shape?: string; count?: number } | null>(null);

  // keep ?q= and ?spec= in the URL
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries() || []));
    if (query) sp.set("q", query);
    else sp.delete("q");
    if (specFilter) sp.set("spec", specFilter);
    else sp.delete("spec");
    router.replace(`/koc?${sp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, specFilter]);

  // initial load
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const items = await fetchCoaches(initialQuery, setError, setDebugInfo);
      if (active) {
        setLoading(false);
        if (items) {
          setCoachesRaw(items);
          setCoaches(applySpecFilter(items, initialSpec));
        } else {
          setCoachesRaw([]);
          setCoaches([]);
          if (!error) setError("Koçlar yüklenemedi.");
        }
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live search (debounced)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      setFetching(true);
      setError(null);
      const items = await fetchCoaches(query, setError, setDebugInfo);
      setFetching(false);
      if (items) {
        setCoachesRaw(items);
        setCoaches(applySpecFilter(items, specFilter));
      } else {
        setCoachesRaw([]);
        setCoaches([]);
        setError("Arama sırasında bir sorun oluştu.");
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // when dropdown changes, re-filter without refetch
  useEffect(() => {
    setCoaches(applySpecFilter(coachesRaw, specFilter));
  }, [specFilter, coachesRaw]);

  const handleManualSearch = async () => {
    setFetching(true);
    setError(null);
    const items = await fetchCoaches(query, setError, setDebugInfo);
    setFetching(false);
    if (items) {
      setCoachesRaw(items);
      setCoaches(applySpecFilter(items, specFilter));
    } else {
      setCoachesRaw([]);
      setCoaches([]);
      setError("Arama sırasında bir sorun oluştu.");
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleManualSearch();
  };

  const specOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of coachesRaw) {
      for (const sp of toArray(c.specialization)) {
        if (sp) s.add(sp);
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [coachesRaw]);

  const resultCountText = useMemo(() => {
    if (loading) return "";
    if (!coaches?.length) return "Sonuç bulunamadı";
    return `${coaches.length} koç bulundu`;
  }, [loading, coaches]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Koçlar</h1>
          <p className="text-muted-foreground mt-1">
            Uzman koçları keşfet, profillerini incele ve sana uygun olanı seç.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, uzmanlık, şehir..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
              aria-label="Koç ara"
            />
          </div>

          {/* Specialization dropdown */}
          <Select value={specFilter} onValueChange={(v) => setSpecFilter(v)}>
            <SelectTrigger className="w-[180px]" aria-label="Uzmanlık filtresi">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Uzmanlık" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tümü</SelectItem>
              {specOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleManualSearch} disabled={fetching}>
            {fetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aranıyor
              </>
            ) : (
              "Ara"
            )}
          </Button>
        </div>
      </div>

      {/* Optional debug panel */}
      {debug && debugInfo && (
        <div className="mb-4 rounded-lg border p-3 text-xs">
          <div><b>Last URL:</b> {debugInfo.url}</div>
          <div><b>Status:</b> {debugInfo.status}</div>
          <div><b>Shape:</b> {debugInfo.shape}</div>
          <div><b>Items:</b> {debugInfo.count ?? "-"}</div>
          {specFilter && <div><b>Spec filter:</b> {specFilter}</div>}
        </div>
      )}

      {/* Result meta */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{resultCountText}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <CoachSkeletonGrid />
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : coaches.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">Aramanızla eşleşen koç bulunamadı.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <li key={c._id}>
              <Link href={`/koc/${c._id}`} className="block group">
                <Card className="transition hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.avatar || c.profilePicture || ""} alt={c.name} />
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate group-hover:underline">{c.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {c.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {c.city}
                          </span>
                        )}
                        {typeof c.rating === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {c.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {toArray(c.specialization).slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="secondary" className="capitalize">
                          <Dumbbell className="h-3.5 w-3.5 mr-1" />
                          {spec}
                        </Badge>
                      ))}
                      {toArray(c.specialization).length > 3 && (
                        <Badge variant="outline">+{toArray(c.specialization).length - 3}</Badge>
                      )}
                    </div>

                    {c.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{c.bio}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {c.programsCount ? `${c.programsCount} program` : "Program bilgisi yok"}
                      </span>
                      <Button size="sm" variant="secondary">
                        Profili Gör
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------- Helpers ------- */
function initials(name?: string) {
  if (!name) return "KÇ";
  const parts = name.trim().split(/\s+/);
  const two = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return two.toUpperCase() || parts[0]?.[0]?.toUpperCase() || "KÇ";
}
function toArray(x?: string | string[]) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}
function applySpecFilter(items: Coach[], spec: string) {
  const s = spec.trim().toLowerCase();
  if (!s) return items;
  return items.filter((c) =>
    toArray(c.specialization).some((sp) => sp?.toLowerCase() === s)
  );
}
function CoachSkeletonGrid() {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="w-full">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-5/6 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------- Data fetch (returns only coaches) ------- */
async function fetchCoaches(
  q: string,
  setError: (e: string | null) => void,
  setDebug?: (d: any) => void
): Promise<Coach[] | null> {
  const qs = (key?: string) => {
    const p = new URLSearchParams();
    if (key && q) p.set(key, q);
    p.set("role", "coach"); // ask server to filter if supported
    return `?${p.toString()}`;
    // server may ignore; we still filter client-side below
  };

  const candidates = [
    `${API}/users${qs("search")}`,
    `${API}/users${qs("q")}`,
    `${API}/users${qs("name")}`,
    `${API}/coaches${qs("search")}`,
    `${API}/coaches${qs("q")}`,
    `${API}/coaches${qs("name")}`,
    `${API}/users${qs()}`,
    `${API}/coaches${qs()}`,
  ];

  const onlyCoaches = (arr: any[]): Coach[] =>
    (arr || []).filter((it) => String((it?.role ?? "coach")).toLowerCase() === "coach");

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const status = res.status;
      if (!res.ok) {
        setDebug?.({ url, status, shape: "HTTP error" });
        continue;
      }

      const json = await res.json().catch(() => ({} as any));
      const items: any[] =
        (Array.isArray(json?.coaches) && json.coaches) ||
        (Array.isArray(json?.users) && json.users) ||
        (Array.isArray(json?.data?.coaches) && json.data.coaches) ||
        (Array.isArray(json?.data?.users) && json.data.users) ||
        (Array.isArray(json?.results) && json.results) ||
        (Array.isArray(json?.data?.results) && json.data.results) ||
        (Array.isArray(json) ? json : []);

      const shape = Array.isArray(json)
        ? "array-root"
        : Object.keys(json || {}).join(",") || "unknown";

      const filtered = onlyCoaches(items);
      setDebug?.({ url, status, shape, count: filtered.length });

      setError(null);
      return filtered;
    } catch (e: any) {
      setDebug?.({ url, status: 0, shape: e?.message || "network error" });
      continue;
    }
  }

  setError("Veri alınamadı (URL, CORS veya JSON şeması).");
  return null;
}
