'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageCircle, ChevronRight, Search, Sparkles, Loader2 } from 'lucide-react';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Client {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface RiskResult {
  level: 'high' | 'medium' | 'low';
  reasons: string[];
  action: string;
}

const RISK_BADGE: Record<string, { label: string; cls: string }> = {
  high: { label: 'Yüksek Risk', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: 'İzle', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  low: { label: 'İyi', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

interface Program {
  _id: string;
  name: string;
  assignedClients?: Client[];
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-green-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-teal-500 to-cyan-600',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getChatId(coachId: string, clientId: string) {
  return [coachId, clientId].sort().join('_');
}

export default function CoachClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPrograms, setClientPrograms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coachId, setCoachId] = useState<string | null>(null);
  const [riskResults, setRiskResults] = useState<Record<string, RiskResult>>({});
  const [riskLoading, setRiskLoading] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCoachId(JSON.parse(stored)?.id ?? null); } catch {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/programs/coach`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const programs: Program[] = Array.isArray(data.programs) ? data.programs : [];
        const clientMap = new Map<string, Client>();
        const programMap: Record<string, string[]> = {};

        programs.forEach((program) => {
          (program.assignedClients || []).forEach((client) => {
            clientMap.set(client._id, client);
            if (!programMap[client._id]) programMap[client._id] = [];
            programMap[client._id].push(program.name);
          });
        });

        setClients(Array.from(clientMap.values()));
        setClientPrograms(programMap);
      })
      .catch(() => toast.error('Danışanlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const analyzeAllRisks = async () => {
    if (clients.length === 0) return;
    setRiskLoading(true);
    const token = localStorage.getItem('token');
    const results: Record<string, RiskResult> = {};
    await Promise.all(
      clients.map(async (client) => {
        try {
          const res = await fetch(`${API}/ai/churn-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ clientId: client._id }),
          });
          const data = await res.json();
          if (res.ok) results[client._id] = data.risk;
        } catch {}
      })
    );
    setRiskResults(results);
    setRiskLoading(false);
    const highCount = Object.values(results).filter(r => r.level === 'high').length;
    if (highCount > 0) toast.error(`${highCount} danışan yüksek risk taşıyor!`);
    else toast.success('Risk analizi tamamlandı.');
  };

  const q = search.toLowerCase();
  const filtered = clients.filter(
    (c) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
  );

  if (loading) return (
    <CoachPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </CoachPageShell>
  );

  return (
    <CoachPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Danışanlarım</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{clients.length} danışan atanmış</p>
          </div>
          {clients.length > 0 && (
            <button
              onClick={analyzeAllRisks}
              disabled={riskLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors"
            >
              {riskLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {riskLoading ? 'Analiz ediliyor...' : 'AI Risk Analizi'}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2 text-muted-foreground">
            <p className="text-4xl">👥</p>
            <p className="font-semibold">
              {clients.length === 0 ? 'Henüz danışan atanmamış' : 'Sonuç bulunamadı'}
            </p>
            {clients.length === 0 && (
              <Link href="/dashboard/coach/programs" className="text-sm text-primary hover:underline">
                Programlarınıza danışan atayın →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((client) => {
              const programs = clientPrograms[client._id] ?? [];
              const chatId = coachId ? getChatId(coachId, client._id) : null;

              const risk = riskResults[client._id];
              const badge = risk ? RISK_BADGE[risk.level] : null;

              return (
                <li key={client._id} className="group bg-card border rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(client.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {initials(client.name)}
                    </div>

                    {/* Info */}
                    <Link href={`/dashboard/coach/clients/${client._id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{client.name}</p>
                        {badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      {programs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {programs.slice(0, 3).map((p) => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {p}
                            </span>
                          ))}
                          {programs.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{programs.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {risk && expandedRisk === client._id && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {risk.reasons.map((r, i) => <p key={i}>• {r}</p>)}
                          <p className="text-foreground font-medium mt-1">→ {risk.action}</p>
                        </div>
                      )}
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {risk && (
                        <button
                          onClick={(e) => { e.preventDefault(); setExpandedRisk(expandedRisk === client._id ? null : client._id); }}
                          title="Detay"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-violet-600 hover:bg-violet-100 transition-colors"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                      )}
                      {chatId && (
                        <Link
                          href={`/dashboard/coach/messages/${chatId}`}
                          title="Mesaj Gönder"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/coach/clients/${client._id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CoachPageShell>
  );
}
