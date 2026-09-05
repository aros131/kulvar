'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Dumbbell, CalendarCheck, CalendarClock, TrendingUp, Star, Wallet, Clock, Sparkles, Loader2 } from 'lucide-react';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface AnalyticsData {
  totalPrograms: number;
  totalClients: number;
  totalRevenue: number;
  pendingRevenue: number;
  completedSessions: number;
  upcomingSessions: number;
  avgClientProgress: number | null;
  avgRating: number;
  reviewCount: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ?? 'bg-muted'}`}>
          <Icon className="h-4 w-4 text-foreground/60" />
        </span>
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="h-4 w-4"
          fill={s <= Math.round(rating) ? 'currentColor' : 'none'}
          style={{ color: s <= Math.round(rating) ? '#f59e0b' : undefined }}
          strokeWidth={s <= Math.round(rating) ? 0 : 1.5}
        />
      ))}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 space-y-8">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export default function CoachAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error('Analitik veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const runInsights = async () => {
    if (!data) return;
    setInsightsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/coach-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setInsights(d.insights);
    } catch (err: any) {
      toast.error('AI öngörü alınamadı: ' + (err.message || ''));
    } finally {
      setInsightsLoading(false);
    }
  };

  const totalRevenue = data?.totalRevenue ?? 0;
  const pendingRevenue = data?.pendingRevenue ?? 0;
  const collectedRevenue = totalRevenue - pendingRevenue;
  const collectionRate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;
  const progress = data?.avgClientProgress ?? null;
  const rating = data?.avgRating ?? 0;

  return (
    <CoachPageShell>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analitik</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Programlarının ve danışanlarının genel görünümü.</p>
          </div>

          {/* Top stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Toplam Danışan" value={data?.totalClients ?? 0} icon={Users} accent="bg-blue-500/10" />
            <StatCard label="Toplam Program" value={data?.totalPrograms ?? 0} icon={Dumbbell} accent="bg-emerald-500/10" />
            <StatCard label="Tamamlanan Seans" value={data?.completedSessions ?? 0} icon={CalendarCheck} accent="bg-green-500/10" />
            <StatCard label="Yaklaşan Seans" value={data?.upcomingSessions ?? 0} icon={CalendarClock} accent="bg-orange-500/10" />
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Revenue card */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Kazanç Özeti</h2>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-3xl font-bold tabular-nums">₺{totalRevenue.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">toplam gelir</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tahsilat oranı</span>
                  <span className="font-medium text-foreground">{collectionRate}%</span>
                </div>
                <ProgressBar pct={collectionRate} color="rgb(16 185 129)" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Tahsil Edilen</p>
                  <p className="text-base font-semibold tabular-nums text-emerald-600">₺{collectedRevenue.toLocaleString('tr-TR')}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Bekleyen</p>
                  <p className="text-base font-semibold tabular-nums text-orange-500">₺{pendingRevenue.toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Performance card */}
            <div className="rounded-2xl border bg-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Performans</h2>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </span>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Ortalama Puan</p>
                  <p className="text-xs text-muted-foreground">{data?.reviewCount ?? 0} yorum</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold tabular-nums">{rating ? rating.toFixed(1) : '—'}</p>
                  {rating > 0 && <RatingStars rating={rating} />}
                </div>
                {rating > 0 && <ProgressBar pct={(rating / 5) * 100} color="rgb(245 158 11)" />}
              </div>

              <div className="h-px bg-border" />

              {/* Avg progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Ort. Danışan İlerlemesi</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {progress != null ? `%${progress}` : '—'}
                  </p>
                </div>
                {progress != null && (
                  <ProgressBar
                    pct={progress}
                    color={progress >= 70 ? 'rgb(16 185 129)' : progress >= 40 ? 'rgb(245 158 11)' : 'rgb(239 68 68)'}
                  />
                )}
                {progress == null && (
                  <p className="text-xs text-muted-foreground">Henüz yeterli veri yok.</p>
                )}
              </div>

              {/* Sessions summary */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {(data?.completedSessions ?? 0) + (data?.upcomingSessions ?? 0)} toplam seans —{' '}
                  {data?.upcomingSessions ?? 0} yaklaşıyor
                </span>
              </div>
            </div>
          </div>

          {/* Summary banner */}
          {(data?.totalClients ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed bg-card p-8 text-center space-y-2">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Henüz danışan atanmamış. Programlarına danışan atayarak istatistiklerini takip edebilirsin.
              </p>
            </div>
          )}

          {/* AI Coach Insights */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">AI Koç Öngörüleri</h2>
                  <p className="text-xs text-muted-foreground">Verilerini analiz et, fırsatları gör</p>
                </div>
              </div>
              <button
                onClick={runInsights}
                disabled={insightsLoading || !data}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                {insightsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {insightsLoading ? 'Analiz ediliyor...' : 'Öngörü Al'}
              </button>
            </div>

            {insights ? (
              <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{insights}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                AI, koçluk verilerini analiz ederek güçlü yönlerini ve gelişim alanlarını tespit eder.
              </p>
            )}
          </div>
        </div>
      )}
    </CoachPageShell>
  );
}
