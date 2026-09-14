'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

interface Client { _id: string; name: string; email: string; }
interface Program {
  _id: string;
  name: string;
  description: string;
  fitnessGoal: string;
  difficulty: string;
  duration: number;
  status: string;
  priceCents?: number | null;
  assignedClients?: Client[];
}

function formatPrice(priceCents: number | null | undefined, locale: string, freeLabel: string): string {
  if (!priceCents || priceCents <= 0) return freeLabel;
  return new Intl.NumberFormat(LOCALE_TAG[locale] || "tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(priceCents / 100);
}

export default function CoachProgramsPage() {
  const t = useTranslations('programsCoach');
  const locale = useLocale();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (program: Program) => {
    const assignedCount = program.assignedClients?.length || 0;
    const warning = assignedCount > 0
      ? t('deleteWarningWithClients', { name: program.name, count: assignedCount })
      : t('deleteWarning', { name: program.name });
    if (!window.confirm(warning)) return;

    setDeletingId(program._id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/programs/${program._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPrograms((prev) => prev.filter((p) => p._id !== program._id));
      toast.success(t('deleted'));
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleConvertToTemplate = async (program: Program) => {
    setConvertingId(program._id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/programs/${program._id}/convert-to-template`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success(t('templateCreated'));
    } catch {
      toast.error(t('templateCreateError'));
    } finally {
      setConvertingId(null);
    }
  };

  const openAssign = (programId: string, current: Client[]) => {
    setAssigningId(programId);
    setSelectedClients(current.map((c) => c._id));
    setClientSearch('');
    setOnlySelected(false);
  };

  const filteredClients = allClients.filter((c) => {
    if (onlySelected && !selectedClients.includes(c._id)) return false;
    const q = clientSearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

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
        body: JSON.stringify({ userIds: selectedClients }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('clientsUpdated'));
      setPrograms((prev) =>
        prev.map((p) =>
          p._id === assigningId
            ? { ...p, assignedClients: allClients.filter((c) => selectedClients.includes(c._id)) }
            : p
        )
      );
      setAssigningId(null);
    } catch {
      toast.error(t('assignError'));
    }
  };

  if (loading) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">{t('loading')}</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="px-4 py-8 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('heading')}</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/coach/templates">
            <Button variant="outline">{t('myTemplates')}</Button>
          </Link>
          <Link href="/dashboard/coach/programs/create">
            <Button>{t('newProgram')}</Button>
          </Link>
        </div>
      </div>

      {programs.length === 0 && (
        <p className="text-muted-foreground">{t('empty')}</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program._id} className="bg-card dark:bg-primary/90 border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-lg">{program.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  program.priceCents && program.priceCents > 0
                    ? "bg-primary/10 text-primary"
                    : "bg-zinc-100 dark:bg-primary/80 text-muted-foreground"
                }`}
              >
                {formatPrice(program.priceCents, locale, t('free'))}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{program.difficulty}</span>
              <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{program.fitnessGoal}</span>
              <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{t('weeksUnit', { value: program.duration })}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('assignedClientsCount', { count: program.assignedClients?.length || 0 })}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/dashboard/coach/programs/${program._id}`}>
                <Button variant="outline" size="sm">{t('view')}</Button>
              </Link>
              <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                <Button variant="outline" size="sm">{t('edit')}</Button>
              </Link>
              <Button size="sm" onClick={() => openAssign(program._id, program.assignedClients || [])}>
                {t('assignClient')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConvertToTemplate(program)}
                disabled={convertingId === program._id}
              >
                {convertingId === program._id ? t('creatingTemplate') : t('makeTemplate')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(program)}
                disabled={deletingId === program._id}
              >
                {deletingId === program._id ? t('deleting') : t('delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Danışan Atama Modal */}
      {assigningId && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-primary/90 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-bold">{t('assignClientTitle')}</h2>
            {allClients.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noRegisteredUsers')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={onlySelected}
                      onChange={(e) => setOnlySelected(e.target.checked)}
                    />
                    {t('showSelectedOnly', { count: selectedClients.length })}
                  </label>
                </div>
                {filteredClients.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-2">{t('noMatchingClients')}</p>
                ) : (
              <ul className="max-h-64 overflow-y-auto space-y-2">
                {filteredClients.map((c) => (
                  <li
                    key={c._id}
                    onClick={() => toggleClient(c._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${
                      selectedClients.includes(c._id)
                        ? 'border-black dark:border-white bg-zinc-50 dark:bg-primary/80'
                        : 'border-border dark:border-zinc-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-xs font-bold">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    {selectedClients.includes(c._id) && (
                      <span className="ml-auto text-green-500 font-bold">✓</span>
                    )}
                  </li>
                ))}
              </ul>
                )}
              </>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssigningId(null)}>{t('cancel')}</Button>
              <Button onClick={saveAssignment}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </CoachPageShell>
  );
}
