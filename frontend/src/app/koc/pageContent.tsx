'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CoachCard from '@/components/CoachCard';

// ui (shadcn)
import { SlidersHorizontal, LayoutGrid, List, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

// small util (remove if you already have cn in '@/lib/utils')
function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

type RoleCoach = 'coach';
interface Coach {
  id: string;
  name: string;
  email?: string;
  role: RoleCoach;
  specialization?: string;
  profilePicture?: string;

  // optional future fields (safe to keep even if API doesn't return them yet)
  rating?: number;
  priceFrom?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  languages?: string[];
}

interface CoachFromAPI extends Omit<Coach, 'id'> {
  _id: string;
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://kulvar-qb7t.onrender.com').replace(/\/+$/, '');

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ----- Filters state -----
type Filters = {
  price: [number, number];   // ₺min, ₺max (client-side only for now)
  ratingMin: number;         // 0..5
  languages: string[];       // ['TR','EN']
  onlineOnly: boolean;
  verifiedOnly: boolean;
  specialization: string[];  // multi-select (in addition to top dropdown)
};
const defaultFilters: Filters = {
  price: [0, 2000],
  ratingMin: 0,
  languages: [],
  onlineOnly: false,
  verifiedOnly: false,
  specialization: [],
};

type SortKey = 'name-asc' | 'name-desc' | 'rating-desc' | 'price-asc';

export default function CoachesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven initial state
  const initialFilter = searchParams.get('specialization') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // new UI states
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>('name-asc');

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // keep URL in sync (q + specialization)
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (filter && filter !== 'all') next.set('specialization', filter);
    else next.delete('specialization');

    if (debouncedSearch) next.set('q', debouncedSearch);
    else next.delete('q');

    const qs = next.toString();
    router.replace(qs ? `?${qs}` : '', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  // fetch coaches (server-side filtering by single specialization)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const qs = filter !== 'all' ? `?specialization=${encodeURIComponent(filter)}` : '';
    const url = `${API}/coaches${qs}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ''}`);
        }
        return res.json();
      })
      .then((data: CoachFromAPI[]) => {
        const formatted: Coach[] = (Array.isArray(data) ? data : []).map((c) => ({
          id: c._id,
          name: c.name || 'İsimsiz Koç',
          email: c.email,
          role: 'coach',
          specialization: c.specialization,
          profilePicture: c.profilePicture,
          rating: c.rating,
          priceFrom: c.priceFrom,
          isOnline: c.isOnline,
          isVerified: c.isVerified,
          languages: c.languages,
        }));
        formatted.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        setCoaches(formatted);
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') setError(err?.message || 'Veriler alınırken bir hata oluştu.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filter, reloadKey]);

  // dynamic specialization options (from API + defaults)
  const dynamicSpecs = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => c.specialization && set.add(c.specialization));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [coaches]);
  const specializationOptions = useMemo(() => {
    const defaults = ['fitness', 'yoga', 'beslenme', 'pilates'];
    return Array.from(new Set([...defaults, ...dynamicSpecs]));
  }, [dynamicSpecs]);

  // favorites set from localStorage
  const favSet = useMemo(() => {
    try {
      const raw = localStorage.getItem('fav_coaches');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
    // re-evaluate when list changes or toggle changes for immediate feel
  }, [onlyFavs, coaches]);

  // apply search + filters + sort
  const filteredCoaches = useMemo(() => {
    let list = coaches;

    // search by name
    const q = debouncedSearch.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));

    // single specialization dropdown (from header)
    if (filter !== 'all') {
      list = list.filter((c) => c.specialization === filter);
    }

    // multi specialization (from Filters drawer)
    if (filters.specialization.length > 0) {
      const set = new Set(filters.specialization);
      list = list.filter((c) => c.specialization && set.has(c.specialization));
    }

    // favorites only
    if (onlyFavs) list = list.filter((c) => favSet.has(c.id));

    // (optional) languages / online / verified / rating / price — will apply only if data exists
    if (filters.languages.length > 0) {
      list = list.filter((c) => {
        if (!c.languages || c.languages.length === 0) return false;
        return c.languages.some((lng) => filters.languages.includes(lng));
      });
    }
    if (filters.onlineOnly) list = list.filter((c) => c.isOnline);
    if (filters.verifiedOnly) list = list.filter((c) => c.isVerified);
    if (filters.ratingMin > 0) list = list.filter((c) => (c.rating ?? 0) >= filters.ratingMin);

    // price range (client-side placeholder)
    list = list.filter((c) => {
      const price = c.priceFrom ?? Number.POSITIVE_INFINITY;
      return price >= filters.price[0] && price <= filters.price[1];
    });

    // sort
    list = [...list];
    switch (sort) {
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      case 'name-desc':
        list.sort((a, b) => b.name.localeCompare(a.name, 'tr'));
        break;
      case 'rating-desc':
        list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
        break;
      case 'price-asc':
        list.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
        break;
    }

    return list;
  }, [coaches, debouncedSearch, filter, filters, onlyFavs, favSet, sort]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  // active filters chips
  const hasActive =
    filters.specialization.length > 0 ||
    filters.languages.length > 0 ||
    filters.onlineOnly ||
    filters.verifiedOnly ||
    filters.price[0] !== defaultFilters.price[0] ||
    filters.price[1] !== defaultFilters.price[1] ||
    filters.ratingMin !== defaultFilters.ratingMin ||
    onlyFavs;

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-zinc-800 dark:text-white">Koçlarımız</h1>
        <p className="text-zinc-600 dark:text-zinc-300">Alanında uzman koçlarımızla tanışın ve hedefinize ulaşın.</p>
      </section>

      {/* Search + single specialization */}
      <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto mb-4">
        <input
          type="text"
          placeholder="Koç ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          aria-label="Koç ara"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          aria-label="Uzmanlığa göre filtrele"
        >
          <option value="all">Tümü</option>
          {specializationOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt[0]?.toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto mb-3 flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {loading ? 'Yükleniyor…' : `${filteredCoaches.length} sonuç`}
        </span>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Ada göre (A–Z)</SelectItem>
              <SelectItem value="name-desc">Ada göre (Z–A)</SelectItem>
              <SelectItem value="rating-desc">Puan (yüksek)</SelectItem>
              <SelectItem value="price-asc">Fiyat (düşük)</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={cn('px-2 py-1', view === 'grid' && 'bg-zinc-100 dark:bg-zinc-700')}
              aria-label="Izgara görünüm"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-2 py-1', view === 'list' && 'bg-zinc-100 dark:bg-zinc-700')}
              aria-label="Liste görünüm"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Favorites */}
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-600" />
            <Switch checked={onlyFavs} onCheckedChange={setOnlyFavs} />
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Favoriler</span>
          </div>

          {/* Filters Drawer */}
          <Sheet open={isFiltersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filtreler
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>Filtreler</SheetTitle>
              </SheetHeader>
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                specs={specializationOptions}
                onApply={() => setFiltersOpen(false)}
                onClear={() => setFilters(defaultFilters)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActive && (
        <div className="max-w-6xl mx-auto mb-4 flex flex-wrap items-center gap-2">
          {filters.specialization.map((s) => (
            <button
              key={s}
              onClick={() => setFilters((f) => ({ ...f, specialization: f.specialization.filter((x) => x !== s) }))}
              className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
            >
              {s} ✕
            </button>
          ))}
          {onlyFavs && (
            <button
              onClick={() => setOnlyFavs(false)}
              className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200"
            >
              Favoriler ✕
            </button>
          )}
          <button
            onClick={() => {
              setFilters(defaultFilters);
              setOnlyFavs(false);
            }}
            className="text-xs underline text-zinc-600 dark:text-zinc-300"
          >
            Tüm filtreleri temizle
          </button>
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
          <p className="mb-2">Bir hata oluştu: {error}</p>
          <Button onClick={handleRetry} className="px-3 py-1">Tekrar dene</Button>
        </div>
      )}

      {/* Results */}
      <div
        className={cn(
          'max-w-6xl mx-auto gap-6',
          view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
        )}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CoachCardSkeleton key={i} />)
        ) : filteredCoaches.length > 0 ? (
          filteredCoaches.map((coach) => (
            <div key={coach.id} className={cn(view === 'list' && 'w-full')}>
              <CoachCard
                id={coach.id}
                name={coach.name}
                specialization={coach.specialization}
                profilePicture={coach.profilePicture}
                rating={coach.rating}
                priceFrom={coach.priceFrom}
                isOnline={coach.isOnline}
                isVerified={coach.isVerified}
                languages={coach.languages}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-zinc-500 dark:text-zinc-400">Sonuç bulunamadı.</p>
            <p className="text-sm text-zinc-400 mt-1">Arama terimini veya filtreleri değiştirin.</p>
          </div>
        )}
      </div>
    </main>
  );
}

/* -------- Filters Panel (Drawer) -------- */
function FiltersPanel({
  filters,
  setFilters,
  specs,
  onApply,
  onClear,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  specs: string[];
  onApply: () => void;
  onClear: () => void;
}) {
  const langs = ['TR', 'EN', 'DE', 'AR', 'RU'];

  return (
    <div className="mt-4 space-y-6">
      {/* Price */}
      <div>
        <Label className="mb-2 block">Fiyat aralığı (₺)</Label>
        <Slider
          value={filters.price}
          onValueChange={(v) => setFilters((f) => ({ ...f, price: [v[0], v[1]] as [number, number] }))}
          min={0}
          max={2000}
          step={50}
        />
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">₺{filters.price[0]} – ₺{filters.price[1]}</div>
      </div>

      {/* Rating */}
      <div>
        <Label className="mb-2 block">En az puan</Label>
        <Slider
          value={[filters.ratingMin]}
          onValueChange={(v) => setFilters((f) => ({ ...f, ratingMin: v[0] }))}
          min={0}
          max={5}
          step={0.5}
        />
        <div className="mt-2 text-sm">{filters.ratingMin}★+</div>
      </div>

      <Separator />

      {/* Languages */}
      <div>
        <Label className="mb-2 block">Diller</Label>
        <div className="flex flex-wrap gap-3">
          {langs.map((l) => (
            <label key={l} className="flex items-center gap-2">
              <Checkbox
                checked={filters.languages.includes(l)}
                onCheckedChange={(ck) =>
                  setFilters((f) => {
                    const set = new Set(f.languages);
                    ck ? set.add(l) : set.delete(l);
                    return { ...f, languages: [...set] };
                  })
                }
              />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Specializations (multi) */}
      <div>
        <Label className="mb-2 block">Uzmanlıklar</Label>
        <div className="flex flex-wrap gap-3">
          {specs.map((s) => (
            <label key={s} className="flex items-center gap-2 capitalize">
              <Checkbox
                checked={filters.specialization.includes(s)}
                onCheckedChange={(ck) =>
                  setFilters((f) => {
                    const set = new Set(f.specialization);
                    ck ? set.add(s) : set.delete(s);
                    return { ...f, specialization: [...set] };
                  })
                }
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <Label>Yalnızca çevrimiçi</Label>
        <Switch checked={filters.onlineOnly} onCheckedChange={(v) => setFilters((f) => ({ ...f, onlineOnly: v }))} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Yalnızca doğrulanmış</Label>
        <Switch
          checked={filters.verifiedOnly}
          onCheckedChange={(v) => setFilters((f) => ({ ...f, verifiedOnly: v }))}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onApply}>
          Uygula
        </Button>
        <Button variant="outline" onClick={onClear}>
          Temizle
        </Button>
      </div>
    </div>
  );
}

/* -------- Skeleton -------- */
function CoachCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4 animate-pulse">
      <div className="w-full h-40 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-4" />
      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}
