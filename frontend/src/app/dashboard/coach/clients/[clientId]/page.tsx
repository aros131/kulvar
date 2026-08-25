'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Mail, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt?: string;
}

interface ClientProgram {
  _id: string;
  name: string;
  duration?: number;
  difficulty?: string;
  fitnessGoal?: string;
  progressPercentage: number;
  completedSessions: number;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">İlerleme</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 75 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#6366f1',
          }}
        />
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [programs, setPrograms] = useState<ClientProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCoachId(JSON.parse(stored)?.id ?? null); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const token = localStorage.getItem('token');

    fetch(`${API}/users/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setClient(data.user ?? null);
        setPrograms(Array.isArray(data.programs) ? data.programs : []);
      })
      .catch(() => toast.error('Danışan bilgisi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [clientId]);

  const chatId = coachId && clientId ? [coachId, clientId].sort().join('_') : null;

  if (loading) return (
    <CoachPageShell>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-28 rounded-2xl bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    </CoachPageShell>
  );

  if (!client) return (
    <CoachPageShell>
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Danışan bulunamadı.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">← Geri Dön</Button>
      </div>
    </CoachPageShell>
  );

  return (
    <CoachPageShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Danışanlara Dön
        </button>

        {/* Client header */}
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{client.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3 w-3" />{client.email}
            </p>
            {client.createdAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Kayıt: {new Date(client.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          {chatId && (
            <Link href={`/dashboard/coach/messages/${chatId}`}>
              <Button size="sm" variant="outline" className="gap-2 shrink-0">
                <MessageCircle className="h-4 w-4" /> Mesaj
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Dumbbell className="h-4 w-4" />
              <span className="text-xs">Atanmış Program</span>
            </div>
            <p className="text-2xl font-bold">{programs.length}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Ort. İlerleme</span>
            </div>
            <p className="text-2xl font-bold">
              {programs.length > 0
                ? `${Math.round(programs.reduce((a, p) => a + p.progressPercentage, 0) / programs.length)}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* Programs */}
        <div>
          <h2 className="font-semibold mb-3">Programlar</h2>
          {programs.length === 0 ? (
            <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground text-sm">
              Bu danışana atanmış program yok.{' '}
              <Link href="/dashboard/coach/programs" className="text-primary hover:underline">Program ata →</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p._id} className="bg-card border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.duration && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.duration} hafta</span>}
                        {p.difficulty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.difficulty}</span>}
                        {p.fitnessGoal && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.fitnessGoal}</span>}
                      </div>
                    </div>
                    <Link href={`/dashboard/coach/programs/${p._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs shrink-0">Görüntüle</Button>
                    </Link>
                  </div>
                  <ProgressBar value={p.progressPercentage} />
                  <p className="text-xs text-muted-foreground">{p.completedSessions} seans tamamlandı</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CoachPageShell>
  );
}
