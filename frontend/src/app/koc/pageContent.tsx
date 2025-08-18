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
  // optional fields (shown if present)
  rating?: number;
  priceFrom?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  languages?: string[];
}

interface CoachFromAPI extends Omit<Coach, 'id'> {
  _id: string;
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CoachesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // read initial state from URL
  const initialFilter = searchParams.get('specialization') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // keep URL in sync (q + specialization)
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (filter && filter !== 'all') next.set('specialization', filter);
    else next.delete('specialization');

    if (debouncedSearch) next.set('q', debouncedSearch);
    else next.delete('q');

    router.replace(next.toString() ? `?${next.toString()}` : '', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  // fetch coaches from SAME-ORIGIN /coaches (this is the ONLY route we hit)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const qs = filter !== 'all' ? `?specialization=${encodeURIComponent(filter)}` : '';
    const url = `/coaches${qs}`; // ⬅️ fixed: removed API_BASE

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 120)}` : ''}`);
        }
        if (!ct.includes('application/json')) {
          const text = await res.text().catch(() => '');
          throw new Error(`'${url}' JSON döndürmedi. Örnek: ${text.slice(0, 120)}`);
        }
        return res.json();
      })
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        const formatted: Coach[] = raw.map((c: CoachFromAPI | any) => ({
          id: (c as any)._id || c.id,
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

  // specialization dropdown options (defaults + from API)
  const dynamicSpecs = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => c.specialization && set.add(c.specialization));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [coaches]);

  const specializationOptions = useMemo(() => {
    const defaults = ['fitness', 'yoga', 'beslenme', 'pilates'];
    return Array.from(new Set([...defaults, ...dynamicSpecs]));
  }, [dynamicSpecs]);

  // client-side search by name
  const filteredCoaches = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = coaches;
    if (filter !== 'all') list = list.filter((c) => c.specialization === filter);
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return list;
  }, [coaches, filter, debouncedSearch]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-zinc-800 dark:text-white">Koçlarımız</h1>
        <p className="text-zinc-600 dark:text-zinc-300">Alanında uzman koçlarımızla tanışın ve hedefinize ulaşın.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-6">
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

      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {loading ? 'Yükleniyor…' : `${filteredCoaches.length} sonuç`}
        </span>
        {(searchTerm || filter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilter('all');
            }}
            className="text-sm underline text-zinc-600 dark:text-zinc-300"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CoachCardSkeleton key={i} />)
        ) : filteredCoaches.length > 0 ? (
          filteredCoaches.map((coach) => (
            <CoachCard
              key={coach.id}
              id={coach.id}
              name={coach.name}
              specialization={coach.specialization}
              profilePicture={coach.profilePicture}
            />
          ))
        ) : (
          <p className="text-center text-zinc-500 dark:text-zinc-400 col-span-full">
            Hiç koç bulunamadı. {searchTerm ? 'Arama terimini değiştirin' : 'Filtreleri temizlemeyi deneyin'}.
          </p>
        )}
      </div>
    </main>
  );
}

function CoachCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4 animate-pulse">
      <div className="w-full h-40 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-4" />
      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}
