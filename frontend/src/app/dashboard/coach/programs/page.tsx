'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Client { _id: string; name: string; email: string; }
interface Program {
  _id: string;
  name: string;
  description: string;
  fitnessGoal: string;
  difficulty: string;
  duration: number;
  status: string;
  assignedClients?: Client[];
}

export default function CoachProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API}/programs/coach`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/users/clients`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([progData, clientData]) => {
        setPrograms(Array.isArray(progData.programs) ? progData.programs : []);
        setAllClients(Array.isArray(clientData?.clients) ? clientData.clients : []);
      })
      .catch(() => toast.error('Veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const openAssign = (programId: string, current: Client[]) => {
    setAssigningId(programId);
    setSelectedClients(current.map((c) => c._id));
  };

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const saveAssignment = async () => {
    if (!assigningId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/programs/${assigningId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientIds: selectedClients }),
      });
      if (!res.ok) throw new Error();
      toast.success('Danışanlar güncellendi.');
      setPrograms((prev) =>
        prev.map((p) =>
          p._id === assigningId
            ? { ...p, assignedClients: allClients.filter((c) => selectedClients.includes(c._id)) }
            : p
        )
      );
      setAssigningId(null);
    } catch {
      toast.error('Atama başarısız.');
    }
  };

  if (loading) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">Yükleniyor...</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="px-4 py-8 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Programlarım</h1>
        <Link href="/dashboard/coach/programs/create">
          <Button>+ Yeni Program</Button>
        </Link>
      </div>

      {programs.length === 0 && (
        <p className="text-zinc-400">Henüz program oluşturmadınız.</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program._id} className="bg-white dark:bg-zinc-800 border rounded-xl p-5 shadow-sm space-y-3">
            <div>
              <h2 className="font-semibold text-lg">{program.name}</h2>
              <p className="text-sm text-zinc-500 line-clamp-2">{program.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">{program.difficulty}</span>
              <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">{program.fitnessGoal}</span>
              <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">{program.duration} hafta</span>
            </div>
            <p className="text-xs text-zinc-400">
              {program.assignedClients?.length || 0} danışan atanmış
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/dashboard/coach/programs/${program._id}`}>
                <Button variant="outline" size="sm">Görüntüle</Button>
              </Link>
              <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                <Button variant="outline" size="sm">Düzenle</Button>
              </Link>
              <Button size="sm" onClick={() => openAssign(program._id, program.assignedClients || [])}>
                Danışan Ata
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Danışan Atama Modal */}
      {assigningId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-bold">Danışan Ata</h2>
            {allClients.length === 0 ? (
              <p className="text-zinc-400 text-sm">Sistemde kayıtlı kullanıcı yok.</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto space-y-2">
                {allClients.map((c) => (
                  <li
                    key={c._id}
                    onClick={() => toggleClient(c._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${
                      selectedClients.includes(c._id)
                        ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-700'
                        : 'border-zinc-200 dark:border-zinc-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-xs font-bold">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.email}</p>
                    </div>
                    {selectedClients.includes(c._id) && (
                      <span className="ml-auto text-green-500 font-bold">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssigningId(null)}>İptal</Button>
              <Button onClick={saveAssignment}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </CoachPageShell>
  );
}
