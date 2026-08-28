'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CoachCard from '@/components/CoachCard';

type RoleCoach = 'coach';
interface Coach {
  id: string;
  name: string;
  email?: string;
  role: RoleCoach;
  specialization?: string;
  profilePicture?: string;
  rating?: number;
  priceFrom?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  languages?: string[];
}
interface CoachFromAPI extends Omit<Coach, 'id'> { _id: string; }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function CoachesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilter = searchParams.get('specialization') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (filter && filter !== 'all') next.set('specialization', filter); else next.delete('specialization');
    if (debouncedSearch) next.set('q', debouncedSearch); else next.delete('q');
    router.replace(next.toString() ? `?${next.toString()}` : '', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const qs = filter !== 'all' ? `?specialization=${encodeURIComponent(filter)}` : '';

    if (!API_BASE) {
      setError('NEXT_PUBLIC_API_URL boş. .env.local içine backend URL’inizi koyun.');
      setLoading(false);
      return;
    }

    const url = `${API_BASE}/coaches${qs}`;
    // Debug:
    // console.log('Fetching:', url);

    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          throw new Error(`GET ${url} -> HTTP ${res.status} ${res.statusText}${text ? ` | ${text.slice(0, 180)}` : ''}`);
        }
        if (!ct.includes('application/json')) {
          throw new Error(`GET ${url} JSON değil (ct=${ct}). Örnek: ${text.slice(0, 180)}`);
        }
        try { return JSON.parse(text); } catch { throw new Error('JSON parse hatası.'); }
      })
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        const formatted: Coach[] = raw.map((c: CoachFromAPI | any) => ({
          id: c._id || c.id,
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

  const dynamicSpecs = useMemo(() => {
    const s = new Set<string>();
    coaches.forEach((c) => c.specialization && s.add(c.specialization));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [coaches]);

  const specializationOptions = useMemo(() => {
    const defaults = ['fitness', 'yoga', 'beslenme', 'pilates'];
    return Array.from(new Set([...defaults, ...dynamicSpecs]));
  }, [dynamicSpecs]);

  const filteredCoaches = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = coaches;
    if (filter !== 'all') list = list.filter((c) => c.specialization === filter);
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return list;
  }, [coaches, filter, debouncedSearch]);

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground dark:text-white">Koçlarımız</h1>
        <p className="text-muted-foreground dark:text-zinc-300">Alanında uzman koçlarımızla tanışın ve hedefinize ulaşın.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Koç ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded border border-zinc-300 dark:bg-primary/90 dark:border-primary/50 dark:text-white"
          aria-label="Koç ara"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded border border-zinc-300 dark:bg-primary/90 dark:border-primary/50 dark:text-white"
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

      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
          {loading ? 'Yükleniyor…' : `${filteredCoaches.length} sonuç`}
        </span>
        {(searchTerm || filter !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setFilter('all'); }}
            className="text-sm underline text-muted-foreground dark:text-zinc-300"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
          <p className="mb-1">Bir hata oluştu:</p>
          <pre className="whitespace-pre-wrap text-xs">{error}</pre>
          <button onClick={() => setReloadKey(k => k + 1)} className="mt-3 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CoachCardSkeleton key={i} />)
        ) : filteredCoaches.length > 0 ? (
          filteredCoaches.map((coach) => (
            <CoachCard key={coach.id} id={coach.id} name={coach.name} specialization={coach.specialization} profilePicture={coach.profilePicture} />
          ))
        ) : (
          <p className="text-center text-muted-foreground dark:text-muted-foreground col-span-full">
            Hiç koç bulunamadı. {searchTerm ? 'Arama terimini değiştirin' : 'Filtreleri temizlemeyi deneyin'}.
          </p>
        )}
      </div>
    </main>
  );
}

function CoachCardSkeleton() {
  return (
    <div className="rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-primary/90 p-4 animate-pulse">
      <div className="w-full h-40 bg-zinc-200 dark:bg-primary/80 rounded-lg mb-4" />
      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-primary/80 rounded mb-2" />
      <div className="h-4 w-1/2 bg-zinc-200 dark:bg-primary/80 rounded" />
    </div>
  );
}
