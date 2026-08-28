'use client';

import { useMemo, useState, useEffect, MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, MessageCircle, Bookmark, BookmarkCheck, CircleDashed } from 'lucide-react';
// shadcn/ui hover card
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface CoachCardProps {
  id: string;
  name: string;
  specialization?: string;
  profilePicture?: string;

  rating?: number;            // 0..5
  reviewCount?: number;       // total reviews
  isVerified?: boolean;
  isOnline?: boolean;
  languages?: string[];       // ['TR', 'EN']
  priceFrom?: number;         // starting price (₺/seans)
  bio?: string;               // short preview
  tags?: string[];            // ['hypertrophy','mobility',...]
}

export default function CoachCard({
  id,
  name,
  specialization,
  profilePicture,
  rating,
  reviewCount,
  isVerified,
  isOnline,
  languages = [],
  priceFrom,
  bio,
  tags = [],
}: CoachCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  // ⭐ favorites in localStorage
  const [fav, setFav] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fav_coaches');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setFav(arr.includes(id));
    } catch {
      /* ignore */
    }
  }, [id]);

  const toggleFav = (e: MouseEvent) => {
    e.preventDefault(); // keep the outer Link from navigating
    setFav((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('fav_coaches');
        const arr: string[] = raw ? JSON.parse(raw) : [];
        const updated = next ? Array.from(new Set([...arr, id])) : arr.filter((x) => x !== id);
        localStorage.setItem('fav_coaches', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleMessage = (e: MouseEvent) => {
    e.preventDefault(); // prevent card link navigation
    e.stopPropagation();
    router.push(`/mesaj?to=${id}`);
  };

  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  }, [name]);

  const roundedRating = useMemo(() => {
    if (rating == null || Number.isNaN(rating)) return null;
    return Math.round(rating * 10) / 10;
  }, [rating]);

  const formattedPrice = useMemo(() => {
    if (typeof priceFrom !== 'number') return null;
    try {
      return new Intl.NumberFormat('tr-TR').format(priceFrom);
    } catch {
      return String(priceFrom);
    }
  }, [priceFrom]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-primary/90 shadow-sm hover:shadow-md transition"
    >
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          {/* Outer link for the whole card */}
          <Link
            href={`/koc/${id}`}
            aria-label={`${name} profiline git`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            prefetch
          >
            <div className="p-5">
              {/* Top row: name + actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-1">
                    {name}
                    {isVerified && <CheckCircle2 className="h-4 w-4 text-indigo-500" aria-label="Doğrulanmış" />}
                  </h3>
                </div>
                <button
                  onClick={toggleFav}
                  aria-label={fav ? 'Favorilerden kaldır' : 'Favorilere ekle'}
                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-primary/80 text-muted-foreground dark:text-zinc-300"
                >
                  {fav ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </button>
              </div>

              {/* Avatar + meta */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 relative shrink-0">
                  {!profilePicture || imgError ? (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
                      {initials}
                    </div>
                  ) : (
                    <Image
                      src={profilePicture}
                      alt={`${name} profil fotoğrafı`}
                      fill
                      sizes="80px"
                      className="rounded-full object-cover border-2 border-indigo-500"
                      onError={() => setImgError(true)}
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  {specialization && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-primary/80 text-zinc-700 dark:text-zinc-200">
                      {specialization}
                    </span>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground dark:text-zinc-300">
                    {roundedRating != null ? (
                      <>
                        <Stars value={roundedRating} />
                        <span className="tabular-nums">{roundedRating}</span>
                        {typeof reviewCount === 'number' && <span>({reviewCount})</span>}
                      </>
                    ) : (
                      <span className="italic text-muted-foreground">Henüz puan yok</span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Çevrimiçi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-primary/80 dark:text-zinc-200">
                        <CircleDashed className="h-3 w-3" />
                        Müsait değil
                      </span>
                    )}

                    {languages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                        {languages.slice(0, 2).join(' / ')}
                        {languages.length > 2 ? ' +' : ''}
                      </span>
                    )}

                    {formattedPrice && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-primary/80 text-zinc-700 dark:text-zinc-200">
                        ₺{formattedPrice}+
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA row (button now, no nested link) */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">
                  Profili Gör
                </span>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mesaj
                </button>
              </div>
            </div>
          </Link>
        </HoverCardTrigger>

        {/* Hover Preview */}
        {(bio || tags.length > 0) && (
          <HoverCardContent align="center" side="top" className="w-80 p-4">
            {bio && <p className="text-sm text-zinc-700 dark:text-zinc-200 line-clamp-4">{bio}</p>}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-primary/80 text-zinc-700 dark:text-zinc-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground dark:text-muted-foreground">İpucu: Profili açmadan hızlı önizleme.</div>
          </HoverCardContent>
        )}
      </HoverCard>
    </motion.div>
  );
}

/** Small star row */
function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
