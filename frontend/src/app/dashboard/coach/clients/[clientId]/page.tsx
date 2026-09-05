'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Mail, Dumbbell, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
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
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<string, { analysis?: string; reply?: string }>>({});
  const [progressReport, setProgressReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<string | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [nutritionParams, setNutritionParams] = useState({ goal: 'Kas Kazanımı', weight: '', activityLevel: 'orta', preferences: '' });

  const [adaptationSuggestion, setAdaptationSuggestion] = useState<string | null>(null);
  const [adaptationLoading, setAdaptationLoading] = useState(false);

  const [injuryAssessment, setInjuryAssessment] = useState<string | null>(null);
  const [injuryLoading, setInjuryLoading] = useState(false);

  const [socialContent, setSocialContent] = useState<{ instagram: string; whatsapp: string } | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialAchievements, setSocialAchievements] = useState('');

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
    ])
      .then(([data, ci]) => {
        setClient(data.user ?? null);
        setPrograms(Array.isArray(data.programs) ? data.programs : []);
        const cis = Array.isArray(ci.checkIns) ? ci.checkIns : [];
        setCheckIns(cis);
        // Pre-fill latest check-in weight into nutrition form
        const latestWeight = [...cis].reverse().find(c => c.weight)?.weight;
        if (latestWeight) setNutritionParams(p => ({ ...p, weight: String(latestWeight) }));
      })
      .catch(() => toast.error('Danışan bilgisi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [clientId]);

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
      toast.error('AI yanıt üretemedi.');
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
      toast.error('Rapor üretilemedi.');
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
      toast.error('Beslenme planı oluşturulamadı.');
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
      toast.error('Adaptasyon önerisi alınamadı: ' + (err.message || ''));
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
      toast.error('Yaralanma analizi yapılamadı: ' + (err.message || ''));
    } finally {
      setInjuryLoading(false);
    }
  };

  const runSocialContent = async () => {
    if (!socialAchievements.trim()) { toast.error('Lütfen başarıları girin.'); return; }
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
      toast.error('İçerik oluşturulamadı: ' + (err.message || ''));
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
        {/* AI Beslenme Planı */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">AI Beslenme Planı</h2>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => setShowNutritionForm(v => !v)}>
              <Sparkles className="w-3 h-3 text-violet-500" />
              {showNutritionForm ? 'Kapat' : 'Plan Oluştur'}
            </Button>
          </div>

          {showNutritionForm && (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-3 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Hedef</label>
                  <select value={nutritionParams.goal} onChange={e => setNutritionParams(p => ({ ...p, goal: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                    <option>Kas Kazanımı</option>
                    <option>Kilo Kaybı</option>
                    <option>Genel Sağlık</option>
                    <option>Dayanıklılık</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kilo (kg)</label>
                  <input type="number" value={nutritionParams.weight}
                    onChange={e => setNutritionParams(p => ({ ...p, weight: e.target.value }))}
                    placeholder="örn. 75"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Aktivite seviyesi</label>
                  <select value={nutritionParams.activityLevel} onChange={e => setNutritionParams(p => ({ ...p, activityLevel: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                    <option value="düşük">Düşük</option>
                    <option value="orta">Orta</option>
                    <option value="yüksek">Yüksek</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tercih/kısıt</label>
                  <input type="text" value={nutritionParams.preferences}
                    onChange={e => setNutritionParams(p => ({ ...p, preferences: e.target.value }))}
                    placeholder="örn. vegan, laktozsuz"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
              </div>
              <Button size="sm" onClick={runNutritionPlan} disabled={nutritionLoading} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white w-full">
                {nutritionLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Oluşturuluyor...</> : <><Sparkles className="w-3 h-3" /> Beslenme Planı Oluştur</>}
              </Button>
            </div>
          )}

          {nutritionPlan && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-violet-500 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Beslenme Planı</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{nutritionPlan}</p>
            </div>
          )}
        </div>

        {/* AI Program Adaptasyonu */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">AI Program Adaptasyonu</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                onClick={runAdaptation} disabled={adaptationLoading}>
                {adaptationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-500" />}
                Öneri Al
              </Button>
            </div>
            {adaptationSuggestion ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-blue-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Program Düzenleme Önerileri</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{adaptationSuggestion}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Son check-in verilerine göre AI, programınızı nasıl optimize edebileceğinizi önerir.</p>
            )}
          </div>
        )}

        {/* AI Yaralanma Risk Tespiti */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Yaralanma Risk Analizi</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                onClick={runInjuryRisk} disabled={injuryLoading}>
                {injuryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-orange-500" />}
                Risk Analizi
              </Button>
            </div>
            {injuryAssessment ? (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-orange-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Yaralanma Risk Değerlendirmesi</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{injuryAssessment}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Check-in notlarındaki ağrı/şikayet ifadelerini analiz eder, yaralanma riski taşıyan durumları tespit eder.</p>
            )}
          </div>
        )}

        {/* Sosyal Medya İçerik Üretici */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Sosyal Medya İçeriği</h2>
          </div>
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Danışanın başarılarından ilham verici içerik oluşturun (isim gizlenir).</p>
            <textarea
              value={socialAchievements}
              onChange={e => setSocialAchievements(e.target.value)}
              placeholder="örn. 3 ayda 8 kg verdi, pull-up yapmaya başladı, enerji seviyesi %80 arttı..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={runSocialContent} disabled={socialLoading} className="gap-2 w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:opacity-90">
              {socialLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Oluşturuluyor...</> : <><Sparkles className="w-3 h-3" /> İçerik Oluştur</>}
            </Button>
            {socialContent && (
              <div className="space-y-3 pt-1">
                <div className="rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 p-3">
                  <p className="text-[10px] font-semibold text-pink-600 mb-1">📸 Instagram</p>
                  <p className="text-sm leading-relaxed">{socialContent.instagram}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(socialContent.instagram); toast.success('Kopyalandı!'); }}
                    className="mt-2 text-[10px] text-pink-600 hover:underline"
                  >Kopyala</button>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
                  <p className="text-[10px] font-semibold text-green-600 mb-1">💬 WhatsApp</p>
                  <p className="text-sm leading-relaxed">{socialContent.whatsapp}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(socialContent.whatsapp); toast.success('Kopyalandı!'); }}
                    className="mt-2 text-[10px] text-green-600 hover:underline"
                  >Kopyala</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check-ins */}
        {checkIns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Haftalık Check-in'ler</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={runProgressReport} disabled={reportLoading}>
                {reportLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-500" />}
                AI Rapor
              </Button>
            </div>

            {progressReport && (
              <div className="mb-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> AI İlerleme Raporu
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{progressReport}</p>
              </div>
            )}

            <ul className="space-y-3">
              {checkIns.map((c) => (
                <li key={c._id} className="bg-card border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{c.week}. Hafta</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.weight != null && <span>⚖️ {c.weight} kg</span>}
                    {c.energyLevel != null && <span>⚡ Enerji {c.energyLevel}/5</span>}
                    {c.sleepQuality != null && <span>😴 Uyku {c.sleepQuality}/5</span>}
                    {c.stressLevel != null && <span>🧠 Stres {c.stressLevel}/5</span>}
                    {c.completedWorkouts != null && <span>💪 {c.completedWorkouts} antrenman</span>}
                  </div>
                  {c.note && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{c.note}</p>}

                  {/* AI Butonları */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                      onClick={() => runAI(c._id, 'analysis')}
                      disabled={aiLoading[`${c._id}-analysis`]}>
                      {aiLoading[`${c._id}-analysis`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Analiz Et
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => runAI(c._id, 'reply')}
                      disabled={aiLoading[`${c._id}-reply`]}>
                      {aiLoading[`${c._id}-reply`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Yanıt Taslağı
                    </Button>
                  </div>

                  {/* AI Sonuçları */}
                  {aiResults[c._id]?.analysis && (
                    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-violet-500 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Analiz</p>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{aiResults[c._id].analysis}</p>
                    </div>
                  )}
                  {aiResults[c._id]?.reply && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Yanıt Taslağı</p>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{aiResults[c._id].reply}</p>
                    </div>
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
