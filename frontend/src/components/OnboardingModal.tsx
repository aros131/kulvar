'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2, ChevronRight } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Props {
  role: 'coach' | 'user';
  name?: string;
  onboardingCompleted?: boolean;
}

const coachSteps = [
  { icon: '👤', title: 'Profilini Tamamla', desc: 'Biyografini, uzmanlık alanını ve fotoğrafını ekle.', href: '/dashboard/coach/profile' },
  { icon: '📋', title: 'İlk Programını Oluştur', desc: 'Danışanlarına verebileceğin bir program hazırla.', href: '/dashboard/coach/programs/create' },
  { icon: '💬', title: 'Danışanlarınla İletişime Geç', desc: 'Mesajlaşma sistemiyle danışanlarınla bağlantı kur.', href: '/dashboard/coach/messages' },
];

const userSteps = [
  { icon: '👤', title: 'Profilini Tamamla', desc: 'Fitness hedeflerini ve bilgilerini doldur.', href: '/dashboard/user/profile' },
  { icon: '🏋️', title: 'Koçlarımızı Keşfet', desc: 'Sana uygun koçu bul ve iletişime geç.', href: '/koc' },
  { icon: '📊', title: 'Programlarını Takip Et', desc: 'Koçun sana program atadığında buradan takip edersin.', href: '/dashboard/user/programs' },
];

export default function OnboardingModal({ role, name, onboardingCompleted }: Props) {
  const [open, setOpen] = useState(false);
  // user onboarding: 'welcome' | 'ai-form' | 'ai-result' | 'steps'
  const [step, setStep] = useState<'welcome' | 'ai-form' | 'ai-result' | 'steps'>('welcome');
  const [aiParams, setAiParams] = useState({ goal: '', level: 'Başlangıç', age: '', gender: '', availableDays: '3', notes: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<{ karsilama: string; adimlar: string[]; altinKural: string; motivasyon: string } | null>(null);

  useEffect(() => {
    if (onboardingCompleted === undefined) return;
    setOpen(!onboardingCompleted);
  }, [onboardingCompleted]);

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
    if (!aiParams.goal.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/ai/onboarding-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(aiParams),
      });
      const data = await res.json();
      if (!res.ok || !data.plan) throw new Error(data.message || 'Plan oluşturulamadı');
      setAiPlan(data.plan);
      setStep('ai-result');
    } catch {
      setStep('steps');
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) return null;

  const firstName = name?.split(' ')[0] ?? 'Hoş geldin';
  const steps = role === 'coach' ? coachSteps : userSteps;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
      <div className="bg-card dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10" aria-label="Kapat">
          <X size={20} />
        </button>

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8">
            <div className="text-3xl mb-2">👋</div>
            <h2 className="text-2xl font-bold mb-1">Merhaba, {firstName}!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              PerSe'ye hoş geldin. Hızlıca başlamak için iki yol var:
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
                    <p className="font-semibold text-sm">AI ile Kişiselleştirilmiş Plan Al</p>
                    <p className="text-xs text-muted-foreground">Hedefini söyle, AI sana özel yol haritası çıkarsın</p>
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
                  <p className="font-semibold text-sm">Başlangıç Adımlarını Gör</p>
                  <p className="text-xs text-muted-foreground">Genel başlangıç rehberi ile devam et</p>
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
              <h2 className="text-xl font-bold">AI Yol Haritası</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-5">Birkaç bilgi ver, sana özel plan oluşturalım.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hedefin nedir? *</label>
                <input value={aiParams.goal} onChange={e => setAiParams(p => ({ ...p, goal: e.target.value }))}
                  placeholder="örn. 5kg vermek, kas yapmak, daha fit olmak..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Seviye</label>
                  <select value={aiParams.level} onChange={e => setAiParams(p => ({ ...p, level: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option>Başlangıç</option>
                    <option>Orta Düzey</option>
                    <option>İleri Seviye</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Haftada kaç gün?</label>
                  <select value={aiParams.availableDays} onChange={e => setAiParams(p => ({ ...p, availableDays: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Yaş (isteğe bağlı)</label>
                  <input type="number" value={aiParams.age} onChange={e => setAiParams(p => ({ ...p, age: e.target.value }))}
                    placeholder="örn. 25"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cinsiyet (isteğe bağlı)</label>
                  <select value={aiParams.gender} onChange={e => setAiParams(p => ({ ...p, gender: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option value="">Belirtme</option>
                    <option>Erkek</option>
                    <option>Kadın</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Eklemek istediğin bir şey? (isteğe bağlı)</label>
                <input value={aiParams.notes} onChange={e => setAiParams(p => ({ ...p, notes: e.target.value }))}
                  placeholder="örn. diz ağrım var, sabahları antrenman yapıyorum..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="ghost" onClick={() => setStep('welcome')} className="flex-1">← Geri</Button>
              <Button onClick={runAI} disabled={aiLoading || !aiParams.goal.trim()} className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</> : <><Sparkles className="w-4 h-4" /> Plan Oluştur</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── AI RESULT ── */}
        {step === 'ai-result' && aiPlan && (
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold">Yol Haritanız Hazır!</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{aiPlan.karsilama}</p>
            <div className="space-y-2 mb-4">
              {aiPlan.adimlar.map((adim, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  <p className="text-sm leading-relaxed">{adim}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">💡 Altın Kural</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{aiPlan.altinKural}</p>
            </div>
            <p className="text-xs text-muted-foreground italic text-center mb-5">{aiPlan.motivasyon}</p>
            <Button onClick={dismiss} className="w-full">Harika, başlayalım! 🚀</Button>
          </div>
        )}

        {/* ── STEPS (standard) ── */}
        {step === 'steps' && (
          <div className="p-6 sm:p-8">
            <div className="text-3xl mb-2">🗺️</div>
            <h2 className="text-xl font-bold mb-1">Başlarken</h2>
            <p className="text-muted-foreground text-sm mb-6">Bu adımları takip ederek hızlıca ilerleyebilirsin:</p>
            <ul className="space-y-4 mb-8">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="text-2xl w-10 text-center shrink-0">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <Link href={s.href} onClick={dismiss} className="text-xs text-primary font-medium hover:underline shrink-0">Git →</Link>
                </li>
              ))}
            </ul>
            <Button onClick={dismiss} className="w-full rounded-xl">Tamam, başlayalım!</Button>
          </div>
        )}
      </div>
    </div>
  );
}
