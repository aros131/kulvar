'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

export default function CoachAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error('Analitik veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <CoachPageShell>
      <div className="p-8 text-sm text-muted-foreground">Yükleniyor...</div>
    </CoachPageShell>
  );

  return (
    <CoachPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analitik</h1>
          <p className="text-sm text-muted-foreground">Programlarının ve danışanlarının genel görünümü.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Toplam Program" value={data?.totalPrograms ?? 0} />
          <StatCard label="Toplam Danışan" value={data?.totalClients ?? 0} />
          <StatCard label="Tamamlanan Seans" value={data?.completedSessions ?? 0} />
          <StatCard label="Yaklaşan Seans" value={data?.upcomingSessions ?? 0} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <StatCard label="Toplam Kazanç" value={`₺${(data?.totalRevenue ?? 0).toLocaleString('tr-TR')}`} />
          <StatCard label="Bekleyen Ödeme" value={`₺${(data?.pendingRevenue ?? 0).toLocaleString('tr-TR')}`} />
        </div>

        <div className="bg-card dark:bg-primary/90 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Performans Özeti</h2>
          <p className="text-sm text-muted-foreground">
            {(data?.totalClients ?? 0) === 0
              ? 'Henüz danışan atanmamış. Programlarınıza danışan atayarak istatistiklerinizi takip edin.'
              : `${data?.totalClients} danışanınız ${data?.totalPrograms} programa atanmış durumda.`}
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Ortalama Danışan İlerlemesi: </span>
              <span className="font-semibold">
                {data?.avgClientProgress != null ? `%${data.avgClientProgress}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ortalama Puan: </span>
              <span className="font-semibold">
                {data?.avgRating ? data.avgRating.toFixed(1) : '—'} ({data?.reviewCount ?? 0} yorum)
              </span>
            </div>
          </div>
        </div>
      </div>
    </CoachPageShell>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card dark:bg-primary/90 border rounded-2xl p-6 shadow-sm text-center">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-5xl font-bold">{value}</p>
    </div>
  );
}
