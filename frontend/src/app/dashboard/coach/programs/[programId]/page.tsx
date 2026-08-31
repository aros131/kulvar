'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Exercise { name: string; sets?: number; reps?: number; duration?: string; }
interface Session { name: string; exercises?: Exercise[]; }
interface DaySchedule { day: string; sessions?: Session[]; notes?: string; }
interface Program {
  _id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: string;
  fitnessGoal: string;
  status: string;
  dailySchedule?: DaySchedule[];
  assignedClients?: { _id: string; name: string; email: string }[];
}

export default function CoachProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState<string | null>(null);

  const handleRebuild = async (userId: string) => {
    setRebuilding(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/events/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, programId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Takvim düzeltildi. Başlangıç: ${new Date(data.startDate).toLocaleDateString('tr-TR')}`);
    } catch (e: any) {
      toast.error(e?.message || 'Takvim düzeltilemedi.');
    } finally {
      setRebuilding(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/programs/${programId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setProgram(d.program || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [programId]);

  if (loading) return <div className="p-8">Yükleniyor...</div>;
  if (!program) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">Program bulunamadı.</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-8">
      {/* Üst bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">← Geri</button>
        <Link href={`/dashboard/coach/programs/${programId}/edit`}>
          <Button variant="outline">Düzenle</Button>
        </Link>
      </div>

      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-muted-foreground">{program.description}</p>
      </div>

      {/* Bilgi kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Süre', value: `${program.duration} hafta` },
          { label: 'Zorluk', value: program.difficulty },
          { label: 'Hedef', value: program.fitnessGoal },
          { label: 'Durum', value: program.status },
        ].map((item) => (
          <div key={item.label} className="bg-card dark:bg-primary/90 rounded-xl p-4 shadow text-center">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="font-semibold text-sm">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Atanmış Danışanlar */}
      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-3">Atanmış Danışanlar ({program.assignedClients?.length || 0})</h2>
        {program.assignedClients?.length ? (
          <ul className="space-y-2">
            {program.assignedClients.map((c) => (
              <li key={c._id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-primary/80 flex items-center justify-center font-bold text-xs shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">{c.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs shrink-0"
                  disabled={rebuilding === c._id}
                  onClick={() => handleRebuild(c._id)}
                >
                  {rebuilding === c._id ? 'Düzeltiliyor…' : 'Takvimi Düzelt'}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Henüz danışan atanmamış.</p>
        )}
      </section>

      {/* Haftalık Program */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Haftalık Program</h2>
        {program.dailySchedule?.length ? (
          program.dailySchedule.map((day, i) => (
            <div key={i} className="bg-card dark:bg-primary/90 rounded-xl p-5 shadow">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{day.day}</Badge>
                {day.notes && <span className="text-xs text-muted-foreground">{day.notes}</span>}
              </div>
              {day.sessions?.map((session, j) => (
                <div key={j} className="mb-3">
                  <p className="font-medium text-sm mb-2">{session.name}</p>
                  {session.exercises?.map((ex, k) => (
                    <div key={k} className="flex items-center gap-4 text-xs text-muted-foreground pl-4 border-l-2 border-border mb-1">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{ex.name}</span>
                      {ex.sets ? <span>{ex.sets} set</span> : null}
                      {ex.reps ? <span>{ex.reps} tekrar</span> : null}
                      {ex.duration ? <span>{ex.duration}</span> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Program içeriği henüz eklenmemiş.</p>
        )}
      </section>
    </div>
    </CoachPageShell>
  );
}
