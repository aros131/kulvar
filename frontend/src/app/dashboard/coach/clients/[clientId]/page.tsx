'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, MessageCircle, Mail, Dumbbell, TrendingUp, Sparkles, Loader2, CalendarDays, Target, Ruler, Activity, CreditCard, Pause, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const LOCALE_TAG: Record<string, string> = { tr: 'tr-TR', en: 'en-US', fr: 'fr-FR' };

interface Engagement {
  _id: string;
  billingType: 'monthly' | 'weekly' | 'per_session';
  rate: number;
  status: 'active' | 'paused' | 'ended';
  nextBillingDate?: string | null;
}

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt?: string;
  fitnessGoalType?: string;
  fitnessGoals?: string;
  fitnessLevel?: string;
  availableDays?: string[];
  height?: number | null;
  goalStartWeight?: number | null;
  goalTargetWeight?: number | null;
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

function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
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
  const t = useTranslations('clientDetailCoach');
  const locale = useLocale();
  const dateTag = LOCALE_TAG[locale] || 'tr-TR';
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [programs, setPrograms] = useState<ClientProgram[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<string, { analysis?: string; reply?: string }>>({});
  const [progressReport, setProgressReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<string | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [nutritionParams, setNutritionParams] = useState({ goal: t('goalMuscleGain'), weight: '', activityLevel: t('levelMedium'), preferences: '' });

  const [adaptationSuggestion, setAdaptationSuggestion] = useState<string | null>(null);
  const [adaptationLoading, setAdaptationLoading] = useState(false);

  const [injuryAssessment, setInjuryAssessment] = useState<string | null>(null);
  const [injuryLoading, setInjuryLoading] = useState(false);

  const [socialContent, setSocialContent] = useState<{ instagram: string; whatsapp: string } | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialAchievements, setSocialAchievements] = useState('');

  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [engagementForm, setEngagementForm] = useState({ billingType: 'monthly', rate: '' });
  const [savingEngagement, setSavingEngagement] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCoachId(JSON.parse(stored)?.id ?? null); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const token = localStorage.getItem('token');

    Promise.all([
      fetch(`${API}/users/${clientId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/check-ins/client/${clientId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({})),
      fetch(`${API}/nutrition-logs/client/${clientId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({})),
    ])
      .then(([data, ci, nl]) => {
        setClient(data.user ?? null);
        setPrograms(Array.isArray(data.programs) ? data.programs : []);
        const cis = Array.isArray(ci.checkIns) ? ci.checkIns : [];
        setCheckIns(cis);
        setNutritionLogs(Array.isArray(nl.nutritionLogs) ? nl.nutritionLogs : []);
        // Pre-fill latest check-in weight into nutrition form
        const latestWeight = [...cis].reverse().find(c => c.weight)?.weight;
        if (latestWeight) setNutritionParams(p => ({ ...p, weight: String(latestWeight) }));
      })
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const token = localStorage.getItem('token');
    fetch(`${API}/engagements`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.engagements) ? d.engagements : [];
        const mine = list.find((e: any) => {
          const uid = typeof e.userId === 'object' ? e.userId?._id : e.userId;
          return uid === clientId && e.status !== 'ended';
        });
        setEngagement(mine || null);
      })
      .catch(() => {})
      .finally(() => setEngagementLoading(false));
  }, [clientId]);

  const submitEngagementForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engagementForm.rate) {
      toast.error(t('rateRequired'));
      return;
    }
    setSavingEngagement(true);
    try {
      const token = localStorage.getItem('token');
      const url = engagement ? `${API}/engagements/${engagement._id}` : `${API}/engagements`;
      const method = engagement ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        billingType: engagementForm.billingType,
        rate: Number(engagementForm.rate),
      };
      if (!engagement) body.userId = clientId;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t('genericSaveFailed'));
      setEngagement(data.engagement);
      setShowEngagementForm(false);
      toast.success(engagement ? t('planUpdated') : t('planStarted'));
    } catch (err: any) {
      toast.error(err.message || t('planSaveFailed'));
    } finally {
      setSavingEngagement(false);
    }
  };

  const updateEngagementStatus = async (status: 'active' | 'paused' | 'ended') => {
    if (!engagement) return;
    setSavingEngagement(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/engagements/${engagement._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t('genericUpdateFailed'));
      setEngagement(status === 'ended' ? null : data.engagement);
      toast.success(
        status === 'ended' ? t('planEnded') : status === 'paused' ? t('pausedToast') : t('resumedToast')
      );
    } catch (err: any) {
      toast.error(err.message || t('genericUpdateFailed'));
    } finally {
      setSavingEngagement(false);
    }
  };

  const chatId = coachId && clientId ? [coachId, clientId].sort().join('_') : null;

  const runAI = async (checkInId: string, type: 'analysis' | 'reply') => {
    setAiLoading(prev => ({ ...prev, [`${checkInId}-${type}`]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/check-in-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checkInId }),
      });
      const data = await res.json();
      const text = type === 'analysis' ? data.analysis : data.reply;
      setAiResults(prev => ({ ...prev, [checkInId]: { ...prev[checkInId], [type]: text } }));
    } catch {
      toast.error(t('aiReplyError'));
    } finally {
      setAiLoading(prev => ({ ...prev, [`${checkInId}-${type}`]: false }));
    }
  };

  const runProgressReport = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/progress-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      setProgressReport(data.report);
    } catch {
      toast.error(t('reportError'));
    } finally {
      setReportLoading(false);
    }
  };

  const runNutritionPlan = async () => {
    setNutritionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/nutrition-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(nutritionParams),
      });
      const data = await res.json();
      setNutritionPlan(data.plan);
      setShowNutritionForm(false);
    } catch {
      toast.error(t('nutritionPlanError'));
    } finally {
      setNutritionLoading(false);
    }
  };

  const runAdaptation = async () => {
    setAdaptationLoading(true);
    try {
      const token = localStorage.getItem('token');
      const programInfo = programs[0] ? { name: programs[0].name, difficulty: programs[0].difficulty, fitnessGoal: programs[0].fitnessGoal } : null;
      const res = await fetch(`${API}/ai/program-adaptation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId, programInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAdaptationSuggestion(data.suggestion);
    } catch (err: any) {
      toast.error(t('adaptationError', { error: err.message || '' }));
    } finally {
      setAdaptationLoading(false);
    }
  };

  const runInjuryRisk = async () => {
    setInjuryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/injury-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInjuryAssessment(data.assessment);
    } catch (err: any) {
      toast.error(t('injuryAnalysisError', { error: err.message || '' }));
    } finally {
      setInjuryLoading(false);
    }
  };

  const runSocialContent = async () => {
    if (!socialAchievements.trim()) { toast.error(t('achievementsRequired')); return; }
    setSocialLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/social-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achievements: socialAchievements }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSocialContent(data.content);
    } catch (err: any) {
      toast.error(t('contentError', { error: err.message || '' }));
    } finally {
      setSocialLoading(false);
    }
  };

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
        <p className="text-muted-foreground">{t('clientNotFound')}</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">{t('goBack')}</Button>
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
          <ArrowLeft className="h-4 w-4" /> {t('backToClients')}
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
                {t('registered', { date: new Date(client.createdAt).toLocaleDateString(dateTag, { year: 'numeric', month: 'long' }) })}
              </p>
            )}
          </div>
          {chatId && (
            <Link href={`/dashboard/coach/messages/${chatId}`}>
              <Button size="sm" variant="outline" className="gap-2 shrink-0">
                <MessageCircle className="h-4 w-4" /> {t('message')}
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> {t('engagementPlan')}
            </h2>
            {engagement && !showEngagementForm && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setEngagementForm({ billingType: engagement.billingType, rate: String(engagement.rate) });
                  setShowEngagementForm(true);
                }}
              >
                {t('edit')}
              </Button>
            )}
          </div>

          {engagementLoading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : showEngagementForm ? (
            <form onSubmit={submitEngagementForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t('billingPeriod')}</label>
                  <select
                    value={engagementForm.billingType}
                    onChange={(e) => setEngagementForm((f) => ({ ...f, billingType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="monthly">{t('billingMonthly')}</option>
                    <option value="weekly">{t('billingWeekly')}</option>
                    <option value="per_session">{t('billingPerSession')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('rateAmount')}</label>
                  <input
                    type="number"
                    min="0"
                    value={engagementForm.rate}
                    onChange={(e) => setEngagementForm((f) => ({ ...f, rate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={savingEngagement}>
                  {savingEngagement ? t('saving') : engagement ? t('update') : t('startPlan')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowEngagementForm(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : engagement ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">
                  {engagement.billingType === 'monthly' ? t('billingMonthly') : engagement.billingType === 'weekly' ? t('billingWeekly') : t('billingPerSession')}
                </span>
                <span className="text-sm font-semibold">₺{engagement.rate}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    engagement.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {engagement.status === 'active' ? t('statusActive') : t('statusPaused')}
                </span>
              </div>
              {engagement.nextBillingDate && (
                <p className="text-xs text-muted-foreground">
                  {t('nextBilling', { date: new Date(engagement.nextBillingDate).toLocaleDateString(dateTag) })}
                </p>
              )}
              {engagement.billingType === 'per_session' && (
                <p className="text-xs text-muted-foreground">{t('perSessionNote')}</p>
              )}
              <div className="flex gap-2 pt-1">
                {engagement.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => updateEngagementStatus('paused')}
                    disabled={savingEngagement}
                  >
                    <Pause className="h-3 w-3" /> {t('pauseAction')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => updateEngagementStatus('active')}
                    disabled={savingEngagement}
                  >
                    <Play className="h-3 w-3" /> {t('resumeAction')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 text-red-600 hover:text-red-700"
                  onClick={() => updateEngagementStatus('ended')}
                  disabled={savingEngagement}
                >
                  <XCircle className="h-3 w-3" /> {t('endAction')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground mb-3">{t('noEngagement')}</p>
              <Button
                size="sm"
                onClick={() => {
                  setEngagementForm({ billingType: 'monthly', rate: '' });
                  setShowEngagementForm(true);
                }}
              >
                {t('startEngagementCta')}
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Dumbbell className="h-4 w-4" />
              <span className="text-xs">{t('assignedPrograms')}</span>
            </div>
            <p className="text-2xl font-bold">{programs.length}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">{t('avgProgress')}</span>
            </div>
            <p className="text-2xl font-bold">
              {programs.length > 0
                ? `${Math.round(programs.reduce((a, p) => a + p.progressPercentage, 0) / programs.length)}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* Danışan tercihleri — onboarding'de toplanan intake bilgisi, program
            hazırlarken referans alınsın diye burada */}
        {(client.fitnessGoalType || client.fitnessLevel || (client.availableDays?.length ?? 0) > 0 || client.height || client.fitnessGoals) && (
          <div className="bg-card border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {t('clientPreferences')}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {client.fitnessGoalType && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{client.fitnessGoalType}</span>
                </div>
              )}
              {client.fitnessLevel && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{client.fitnessLevel}</span>
                </div>
              )}
              {client.height && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{client.height} cm</span>
                </div>
              )}
              {client.goalStartWeight && client.goalTargetWeight && (
                <div className="flex items-center gap-2 col-span-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t('goalTarget', { start: client.goalStartWeight, target: client.goalTargetWeight })}</span>
                </div>
              )}
            </div>
            {client.availableDays && client.availableDays.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> {t('availableDays')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {client.availableDays.map((d) => (
                    <span key={d} className="text-xs font-medium bg-muted rounded-full px-2.5 py-1">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {client.fitnessGoals && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{client.fitnessGoals}</p>
            )}
          </div>
        )}

        {/* Programs */}
        <div>
          <h2 className="font-semibold mb-3">{t('programsHeading')}</h2>
          {programs.length === 0 ? (
            <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground text-sm">
              {t('noPrograms')}{' '}
              <Link href="/dashboard/coach/programs" className="text-primary hover:underline">{t('assignProgramCta')}</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p._id} className="bg-card border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.duration && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t('weeksCount', { count: p.duration })}</span>}
                        {p.difficulty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.difficulty}</span>}
                        {p.fitnessGoal && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.fitnessGoal}</span>}
                      </div>
                    </div>
                    <Link href={`/dashboard/coach/programs/${p._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs shrink-0">{t('view')}</Button>
                    </Link>
                  </div>
                  <ProgressBar value={p.progressPercentage} label={t('progress')} />
                  <p className="text-xs text-muted-foreground">{t('sessionsCompleted', { count: p.completedSessions })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* AI Nutrition Plan */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{t('aiNutritionPlanHeading')}</h2>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => setShowNutritionForm(v => !v)}>
              <Sparkles className="w-3 h-3 text-violet-500" />
              {showNutritionForm ? t('close') : t('createPlan')}
            </Button>
          </div>

          {showNutritionForm && (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-3 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t('goalLabel')}</label>
                  <select value={nutritionParams.goal} onChange={e => setNutritionParams(p => ({ ...p, goal: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                    <option>{t('goalMuscleGain')}</option>
                    <option>{t('goalWeightLoss')}</option>
                    <option>{t('goalGeneralHealth')}</option>
                    <option>{t('goalEndurance')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('weightKg')}</label>
                  <input type="number" value={nutritionParams.weight}
                    onChange={e => setNutritionParams(p => ({ ...p, weight: e.target.value }))}
                    placeholder={t('egWeight')}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('activityLevel')}</label>
                  <select value={nutritionParams.activityLevel} onChange={e => setNutritionParams(p => ({ ...p, activityLevel: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                    <option value={t('levelLow')}>{t('levelLow')}</option>
                    <option value={t('levelMedium')}>{t('levelMedium')}</option>
                    <option value={t('levelHigh')}>{t('levelHigh')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('preferencesLabel')}</label>
                  <input type="text" value={nutritionParams.preferences}
                    onChange={e => setNutritionParams(p => ({ ...p, preferences: e.target.value }))}
                    placeholder={t('egPreferences')}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
              </div>
              <Button size="sm" onClick={runNutritionPlan} disabled={nutritionLoading} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white w-full">
                {nutritionLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> {t('generating')}</> : <><Sparkles className="w-3 h-3" /> {t('generateNutritionPlan')}</>}
              </Button>
            </div>
          )}

          {nutritionPlan && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-violet-500 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('aiNutritionPlanHeading')}</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{nutritionPlan}</p>
            </div>
          )}
        </div>

        {/* AI Program Adaptation */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{t('aiAdaptationHeading')}</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                onClick={runAdaptation} disabled={adaptationLoading}>
                {adaptationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-500" />}
                {t('getSuggestion')}
              </Button>
            </div>
            {adaptationSuggestion ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-blue-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('adaptationSuggestionsLabel')}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{adaptationSuggestion}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('adaptationHint')}</p>
            )}
          </div>
        )}

        {/* AI Injury Risk Detection */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{t('injuryRiskHeading')}</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                onClick={runInjuryRisk} disabled={injuryLoading}>
                {injuryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-orange-500" />}
                {t('riskAnalysisBtn')}
              </Button>
            </div>
            {injuryAssessment ? (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-orange-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('injuryAssessmentLabel')}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{injuryAssessment}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('injuryHint')}</p>
            )}
          </div>
        )}

        {/* Social Media Content Generator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{t('socialMediaHeading')}</h2>
          </div>
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('socialHint')}</p>
            <textarea
              value={socialAchievements}
              onChange={e => setSocialAchievements(e.target.value)}
              placeholder={t('socialPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={runSocialContent} disabled={socialLoading} className="gap-2 w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:opacity-90">
              {socialLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> {t('generating')}</> : <><Sparkles className="w-3 h-3" /> {t('generateContent')}</>}
            </Button>
            {socialContent && (
              <div className="space-y-3 pt-1">
                <div className="rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 p-3">
                  <p className="text-[10px] font-semibold text-pink-600 mb-1">📸 Instagram</p>
                  <p className="text-sm leading-relaxed">{socialContent.instagram}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(socialContent.instagram); toast.success(t('copied')); }}
                    className="mt-2 text-[10px] text-pink-600 hover:underline"
                  >{t('copy')}</button>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
                  <p className="text-[10px] font-semibold text-green-600 mb-1">💬 WhatsApp</p>
                  <p className="text-sm leading-relaxed">{socialContent.whatsapp}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(socialContent.whatsapp); toast.success(t('copied')); }}
                    className="mt-2 text-[10px] text-green-600 hover:underline"
                  >{t('copy')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check-ins */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{t('weeklyCheckIns')}</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={runProgressReport} disabled={reportLoading}>
                {reportLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-500" />}
                {t('aiReport')}
              </Button>
            </div>

            {progressReport && (
              <div className="mb-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> {t('aiProgressReport')}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{progressReport}</p>
              </div>
            )}

            <ul className="space-y-3">
              {checkIns.map((c) => (
                <li key={c._id} className="bg-card border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{t('weekNumber', { week: c.week })}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString(dateTag)}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.weight != null && <span>⚖️ {c.weight} kg</span>}
                    {c.energyLevel != null && <span>⚡ {t('energyLabel', { value: c.energyLevel })}</span>}
                    {c.sleepQuality != null && <span>😴 {t('sleepLabel', { value: c.sleepQuality })}</span>}
                    {c.stressLevel != null && <span>🧠 {t('stressLabel', { value: c.stressLevel })}</span>}
                    {c.soreness != null && <span>🤕 {t('sorenessLabel', { value: c.soreness })}</span>}
                    {c.steps != null && <span>👣 {t('stepsLabel', { count: c.steps.toLocaleString(dateTag) })}</span>}
                    {c.completedWorkouts != null && <span>💪 {t('workoutsLabel', { count: c.completedWorkouts })}</span>}
                  </div>
                  {c.note && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{c.note}</p>}

                  {/* AI Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                      onClick={() => runAI(c._id, 'analysis')}
                      disabled={aiLoading[`${c._id}-analysis`]}>
                      {aiLoading[`${c._id}-analysis`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {t('analyze')}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => runAI(c._id, 'reply')}
                      disabled={aiLoading[`${c._id}-reply`]}>
                      {aiLoading[`${c._id}-reply`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {t('replyDraft')}
                    </Button>
                  </div>

                  {/* AI Results */}
                  {aiResults[c._id]?.analysis && (
                    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-violet-500 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('aiAnalysisLabel')}</p>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{aiResults[c._id].analysis}</p>
                    </div>
                  )}
                  {aiResults[c._id]?.reply && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('replyDraft')}</p>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{aiResults[c._id].reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nutrition Logs */}
        {nutritionLogs.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">{t('nutritionLogsHeading')}</h2>
            <ul className="space-y-3">
              {nutritionLogs.map((l) => (
                <li key={l._id} className="bg-card border rounded-xl p-4 space-y-2">
                  <span className="font-semibold text-sm">{new Date(l.date).toLocaleDateString(dateTag)}</span>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {l.calories != null && <span>🔥 {t('caloriesUnit', { count: l.calories })}</span>}
                    {l.protein != null && <span>🥩 {t('proteinUnit', { count: l.protein })}</span>}
                    {l.carbs != null && <span>🍞 {t('carbsUnit', { count: l.carbs })}</span>}
                    {l.fat != null && <span>🥑 {t('fatUnit', { count: l.fat })}</span>}
                    {l.water != null && <span>💧 {t('waterUnit', { count: l.water })}</span>}
                  </div>
                  {l.items?.length > 0 && (
                    <ul className="text-sm space-y-1 pt-1 border-t">
                      {l.items.map((it: any, i: number) => (
                        <li key={i} className="flex justify-between text-muted-foreground">
                          <span>{it.description}</span>
                          <span>{it.calories} kcal</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CoachPageShell>
  );
}
