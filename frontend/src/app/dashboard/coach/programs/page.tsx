'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Dumbbell,
  Search,
  Plus,
  Users,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Layers,
} from 'lucide-react';
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
  const [query, setQuery] = useState('');

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

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.fitnessGoal?.toLowerCase().includes(q)
    );
  }, [programs, query]);

  if (loading) {
    return (
      <CoachPageShell>
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10 space-y-4">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </CoachPageShell>
    );
  }

  return (
    <CoachPageShell>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('heading')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('programsCount', { count: programs.length })}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchProgramsPlaceholder')}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 sm:flex-none gap-1.5">
                <Link href="/dashboard/coach/templates">
                  <Layers className="h-4 w-4" />
                  {t('myTemplates')}
                </Link>
              </Button>
              <Button asChild className="flex-1 sm:flex-none gap-1.5">
                <Link href="/dashboard/coach/programs/create">
                  <Plus className="h-4 w-4" />
                  {t('newProgram').replace(/^\+\s*/, '')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Empty states */}
        {programs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-3">
            <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
              <Dumbbell className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <p className="font-semibold">{t('empty')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
            <Button asChild className="gap-1.5">
              <Link href="/dashboard/coach/programs/create">
                <Plus className="h-4 w-4" />
                {t('newProgram').replace(/^\+\s*/, '')}
              </Link>
            </Button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">{t('noSearchResults')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map((program, idx) => {
              const isPaid = !!program.priceCents && program.priceCents > 0;
              const assignedCount = program.assignedClients?.length || 0;
              return (
                <motion.div
                  key={program._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
                  className="flex flex-col rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 grid place-items-center">
                          <Dumbbell className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <h2 className="font-semibold leading-tight truncate" title={program.name}>{program.name}</h2>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          isPaid
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {formatPrice(program.priceCents, locale, t('free'))}
                      </span>
                    </div>

                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {program.difficulty && <span className="bg-muted px-2 py-1 rounded-full">{program.difficulty}</span>}
                      {program.fitnessGoal && <span className="bg-muted px-2 py-1 rounded-full">{program.fitnessGoal}</span>}
                      <span className="bg-muted px-2 py-1 rounded-full">{t('weeksUnit', { value: program.duration })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Users className="h-3.5 w-3.5" />
                      {t('assignedClientsCount', { count: assignedCount })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Link href={`/dashboard/coach/programs/${program._id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        {t('view')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Link href={`/dashboard/coach/programs/${program._id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        {t('edit')}
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0" aria-label={t('moreActions')}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAssign(program._id, program.assignedClients || [])}>
                          <Users className="h-4 w-4" />
                          {t('assignClient')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleConvertToTemplate(program)}
                          disabled={convertingId === program._id}
                        >
                          <Copy className="h-4 w-4" />
                          {convertingId === program._id ? t('creatingTemplate') : t('makeTemplate')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(program)}
                          disabled={deletingId === program._id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === program._id ? t('deleting') : t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danışan Atama Modal */}
      {assigningId && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
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
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                          {c.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        </div>
                        {selectedClients.includes(c._id) && (
                          <span className="ml-auto text-primary font-bold shrink-0">✓</span>
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
    </CoachPageShell>
  );
}
