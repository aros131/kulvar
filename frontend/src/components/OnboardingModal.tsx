'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { GOAL_TYPES, WEIGHT_GOALS, type GoalType } from '@/lib/fitnessGoals';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Props {
  role: 'coach' | 'user';
  name?: string;
  onboardingCompleted?: boolean;
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_LABEL_KEYS = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];

interface CoachMatch {
  coachId: string;
  name: string;
  avatarUrl?: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  tagline?: string;
  reason: string;
}

function initials(name: string) {
  return name?.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function OnboardingModal({ role, name, onboardingCompleted }: Props) {
  const t = useTranslations('onboarding');
  const coachSteps = [
    { icon: '👤', title: t('coachStep1Title'), desc: t('coachStep1Desc'), href: '/dashboard/coach/profile' },
    { icon: '📋', title: t('coachStep2Title'), desc: t('coachStep2Desc'), href: '/dashboard/coach/programs/create' },
    { icon: '💬', title: t('coachStep3Title'), desc: t('coachStep3Desc'), href: '/dashboard/coach/messages' },
  ];
  const userSteps = [
    { icon: '👤', title: t('userStep1Title'), desc: t('userStep1Desc'), href: '/dashboard/user/profile' },
    { icon: '🏋️', title: t('userStep2Title'), desc: t('userStep2Desc'), href: '/koc' },
    { icon: '📊', title: t('userStep3Title'), desc: t('userStep3Desc'), href: '/dashboard/user/programs' },
  ];
  const [open, setOpen] = useState(false);
  // user onboarding: 'body-info' | 'welcome' | 'ai-form' | 'ai-result' | 'steps'
  const [step, setStep] = useState<'body-info' | 'welcome' | 'ai-form' | 'ai-result' | 'steps'>('welcome');
  const [aiParams, setAiParams] = useState({ level: t('levelBeginner'), days: [] as string[], age: '', gender: '', notes: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [matches, setMatches] = useState<CoachMatch[] | null>(null);

  const toggleDay = (d: string) => {
    setAiParams((p) => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d],
    }));
  };

  // Weight/goal tracking (the progress bar on the profile page) needs a
  // starting point — ask for it once, right here, instead of leaving it for
  // the danışan to stumble onto in the profile edit dialog later.
  const [bodyInfo, setBodyInfo] = useState({ height: '', weight: '', goalType: '' as GoalType | '', targetWeight: '' });
  const [savingBodyInfo, setSavingBodyInfo] = useState(false);

  useEffect(() => {
    if (onboardingCompleted === undefined) return;
    setOpen(!onboardingCompleted);
    if (!onboardingCompleted) setStep(role === 'user' ? 'body-info' : 'welcome');
  }, [onboardingCompleted, role]);

  const saveBodyInfo = async () => {
    setSavingBodyInfo(true);
    try {
      const token = localStorage.getItem('token');
      const payload: Record<string, string | number> = {};
      if (bodyInfo.height) payload.height = Number(bodyInfo.height);
      if (bodyInfo.weight) payload.goalStartWeight = Number(bodyInfo.weight);
      if (bodyInfo.goalType) payload.fitnessGoalType = bodyInfo.goalType;
      if (bodyInfo.targetWeight) payload.goalTargetWeight = Number(bodyInfo.targetWeight);
      if (Object.keys(payload).length > 0) {
        await fetch(`${API}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
    } catch {
      // Non-critical — the danışan can always fill this in later from the profile page.
    } finally {
      setSavingBodyInfo(false);
      setStep('welcome');
    }
  };

  const dismiss = () => {
    setOpen(false);
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/profile/onboarding-complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const runAI = async () => {
    if (aiParams.days.length === 0) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const preferences = [
        aiParams.age ? t('ageYearsOld', { age: aiParams.age }) : '',
        aiParams.gender,
        aiParams.notes,
      ].filter(Boolean).join(', ');

      const res = await fetch(`${API}/ai/coach-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          goal: bodyInfo.goalType || t('generalFitnessGoal'),
          level: aiParams.level,
          availableDays: aiParams.days,
          preferences,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('matchError'));
      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setStep('ai-result');

      // Save the intake so it's not thrown away — the coach sees it once
      // assigned, and the danışan doesn't have to answer this again later.
      if (token) {
        const payload: Record<string, unknown> = { fitnessLevel: aiParams.level, availableDays: aiParams.days };
        fetch(`${API}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
    } catch {
      setStep('steps');
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) return null;

  const firstName = name?.split(' ')[0] ?? t('defaultFirstName');
  const steps = role === 'coach' ? coachSteps : userSteps;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
      <div className="bg-card dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10" aria-label={t('close')}>
          <X size={20} />
        </button>

        {/* ── BODY INFO (weight/height/goal — starting point for the progress bar on the profile page) ── */}
        {step === 'body-info' && (
          <div className="p-6 sm:p-8">
            <div className="text-3xl mb-2">📏</div>
            <h2 className="text-2xl font-bold mb-1">{t('greeting', { name: firstName })}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t('bodyInfoSubtitle')}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('heightLabel')}</label>
                  <input
                    type="number"
                    value={bodyInfo.height}
                    onChange={(e) => setBodyInfo((p) => ({ ...p, height: e.target.value }))}
                    placeholder={t('heightPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('weightLabel')}</label>
                  <input
                    type="number"
                    value={bodyInfo.weight}
                    onChange={(e) => setBodyInfo((p) => ({ ...p, weight: e.target.value }))}
                    placeholder={t('weightPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('goalLabel')}</label>
                <select
                  value={bodyInfo.goalType}
                  onChange={(e) => setBodyInfo((p) => ({ ...p, goalType: e.target.value as GoalType }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t('selectPlaceholder')}</option>
                  {GOAL_TYPES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              {bodyInfo.goalType && WEIGHT_GOALS.includes(bodyInfo.goalType) && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('targetWeightLabel')}</label>
                  <input
                    type="number"
                    value={bodyInfo.targetWeight}
                    onChange={(e) => setBodyInfo((p) => ({ ...p, targetWeight: e.target.value }))}
                    placeholder={t('targetWeightPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="ghost" onClick={() => setStep('welcome')} className="flex-1" disabled={savingBodyInfo}>
                {t('skip')}
              </Button>
              <Button onClick={saveBodyInfo} disabled={savingBodyInfo} className="flex-1 gap-2">
                {savingBodyInfo ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</> : t('saveAndContinue')}
              </Button>
            </div>
          </div>
        )}

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8">
            <div className="text-3xl mb-2">👋</div>
            <h2 className="text-2xl font-bold mb-1">{t('greeting', { name: firstName })}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t('welcomeSubtitle')}
            </p>
            <div className="space-y-3">
              {role === 'user' && (
                <button
                  onClick={() => setStep('ai-form')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t('aiMatchTitle')}</p>
                    <p className="text-xs text-muted-foreground">{t('aiMatchDesc')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}
              <button
                onClick={() => setStep('steps')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🗺️</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{t('stepsTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('stepsDesc')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ── AI FORM ── */}
        {step === 'ai-form' && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-bold">{t('aiFormTitle')}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-5">
              {bodyInfo.goalType ? <>{t('aiFormGoalPrefix')} <span className="font-medium text-foreground">{bodyInfo.goalType}</span>. </> : null}
              {t('aiFormSubtitle')}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('daysLabel')}</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        aiParams.days.includes(d)
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-border hover:border-violet-400'
                      }`}
                    >
                      {t(DAY_LABEL_KEYS[i])}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('levelLabel')}</label>
                  <select value={aiParams.level} onChange={e => setAiParams(p => ({ ...p, level: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option>{t('levelBeginner')}</option>
                    <option>{t('levelIntermediate')}</option>
                    <option>{t('levelAdvanced')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ageLabel')}</label>
                  <input type="number" value={aiParams.age} onChange={e => setAiParams(p => ({ ...p, age: e.target.value }))}
                    placeholder={t('agePlaceholder')}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('genderLabel')}</label>
                  <select value={aiParams.gender} onChange={e => setAiParams(p => ({ ...p, gender: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option value="">{t('genderUnspecified')}</option>
                    <option>{t('genderMale')}</option>
                    <option>{t('genderFemale')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('notesLabel')}</label>
                <input value={aiParams.notes} onChange={e => setAiParams(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t('notesPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="ghost" onClick={() => setStep('welcome')} className="flex-1">{t('back')}</Button>
              <Button onClick={runAI} disabled={aiLoading || aiParams.days.length === 0} className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('searching')}</> : <><Sparkles className="w-4 h-4" /> {t('findCoach')}</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── AI RESULT (gerçek koç eşleşmeleri) ── */}
        {step === 'ai-result' && matches && (
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold">
                {matches.length > 0 ? t('resultTitleFound') : t('resultTitleNotFound')}
              </h2>
            </div>

            {matches.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">{t('resultIntro')}</p>
                <div className="space-y-3 mb-5">
                  {matches.map((m) => {
                    const specs = Array.isArray(m.specialization) ? m.specialization.join(', ') : m.specialization;
                    return (
                      <Link
                        key={m.coachId}
                        href={`/dashboard/user/koclarimiz/${m.coachId}`}
                        onClick={dismiss}
                        className="flex gap-3 p-3 rounded-xl border hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            initials(m.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">{m.name}</p>
                            {typeof m.rating === 'number' && m.rating > 0 && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium shrink-0">★ {m.rating.toFixed(1)}</span>
                            )}
                          </div>
                          {(specs || m.city) && (
                            <p className="text-xs text-muted-foreground truncate">{[specs, m.city].filter(Boolean).join(' · ')}</p>
                          )}
                          <p className="text-xs text-muted-foreground italic mt-1 leading-snug">"{m.reason}"</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mb-5">
                {t('noMatchText')}{' '}
                <Link href="/koc" onClick={dismiss} className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                  {t('browseAllCoaches')}
                </Link>.
              </p>
            )}
            <Button onClick={dismiss} className="w-full">{t('continueBtn')}</Button>
          </div>
        )}

        {/* ── STEPS (standard) ── */}
        {step === 'steps' && (
          <div className="p-6 sm:p-8">
            <div className="text-3xl mb-2">🗺️</div>
            <h2 className="text-xl font-bold mb-1">{t('gettingStartedTitle')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('gettingStartedSubtitle')}</p>
            <ul className="space-y-4 mb-8">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="text-2xl w-10 text-center shrink-0">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <Link href={s.href} onClick={dismiss} className="text-xs text-primary font-medium hover:underline shrink-0">{t('goTo')}</Link>
                </li>
              ))}
            </ul>
            <Button onClick={dismiss} className="w-full rounded-xl">{t('allSet')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
