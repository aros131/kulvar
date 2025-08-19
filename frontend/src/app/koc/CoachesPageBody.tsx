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
import { Search, MapPin, Star, Dumbbell, Loader2 } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type Coach = {
  _id: string;
  name: string;
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

  const [query, setQuery] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries() || []));
    if (query) sp.set("q", query);
    else sp.delete("q");
    router.replace(`/koc?${sp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const ok = await fetchCoaches(initialQuery, setCoaches, setError);
      if (active) setLoading(false);
      if (!ok && active) setError("Koçlar yüklenemedi.");
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      setFetching(true);
      setError(null);
      const ok = await fetchCoaches(query, setCoaches, setError);
      setFetching(false);
      if (!ok) setError("Arama sırasında bir sorun oluştu.");
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleManualSearch = async () => {
    setFetching(true);
    setError(null);
    const ok = await fetchCoaches(query, setCoaches, setError);
    setFetching(false);
    if (!ok) setError("Arama sırasında bir sorun oluştu.");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleManualSearch();
  };

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

        {/* Search Bar */}
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

/* ------- Data fetch ------- */
async function fetchCoaches(
  q: string,
  setCoaches: (c: Coach[]) => void,
  setError: (e: string | null) => void
): Promise<boolean> {
  try {
    let url = `${API}/coaches`;
    const params: Record<string, string> = {};
    if (q) params.search = q;
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;

    let res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const fallbackUrl = `${API}/users?role=coach${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      res = await fetch(fallbackUrl, { cache: "no-store" });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items: Coach[] = Array.isArray(data?.coaches)
      ? data.coaches
      : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data)
      ? data
      : [];

    setCoaches(items);
    setError(null);
    return true;
  } catch (err: any) {
    setError(err?.message || "Beklenmeyen bir hata oluştu.");
    setCoaches([]);
    return false;
  }
}
