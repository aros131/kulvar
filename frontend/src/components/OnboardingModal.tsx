'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Props {
  role: 'coach' | 'user';
  name?: string;
  /** From the profile fetch already done by the dashboard page. undefined = not loaded yet. */
  onboardingCompleted?: boolean;
}

export default function OnboardingModal({ role, name, onboardingCompleted }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (onboardingCompleted === undefined) return; // wait until profile has loaded
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

  if (!open) return null;

  const firstName = name?.split(' ')[0] ?? 'Hoş geldin';

  const coachSteps = [
    { icon: '👤', title: 'Profilini Tamamla', desc: 'Biyografini, uzmanlık alanını ve fotoğrafını ekle.', href: '/dashboard/coach/profile' },
    { icon: '📋', title: 'İlk Programını Oluştur', desc: 'Danışanlarına verebileceğin bir program hazırla.', href: '/dashboard/coach/programs/create' },
    { icon: '💬', title: 'Danışanlarınla İletişime Geç', desc: 'Mesajlaşma sistemiyle danışanlarınla bağlantı kur.', href: '/dashboard/coach/messages' },
  ];

  const userSteps = [
    { icon: '👤', title: 'Profilini Tamamla', desc: 'Fitness hedeflerini ve bilgilerini doldur.', href: '/dashboard/user/profile' },
    { icon: '🏋️', title: 'Koçlarımızı Keşfet', desc: 'Sana uygun koçu bul ve iletişime geç.', href: '/dashboard/user/koclarimiz' },
    { icon: '📊', title: 'Programlarını Takip Et', desc: 'Koçun sana program atadığında buradan takip edersin.', href: '/dashboard/user/programs' },
  ];

  const steps = role === 'coach' ? coachSteps : userSteps;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
      <div className="bg-card dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground dark:hover:text-zinc-200"
          aria-label="Kapat"
        >
          <X size={20} />
        </button>

        <div className="text-3xl mb-2">👋</div>
        <h2 className="text-2xl font-bold mb-1">Merhaba, {firstName}!</h2>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-6">
          PerSe&apos;ye hoş geldin. Başlamak için şu adımları takip edebilirsin:
        </p>

        <ul className="space-y-4 mb-8">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="text-2xl w-10 text-center shrink-0">{step.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">{step.desc}</p>
              </div>
              <Link
                href={step.href}
                onClick={dismiss}
                className="text-xs text-primary font-medium hover:underline shrink-0"
              >
                Git →
              </Link>
            </li>
          ))}
        </ul>

        <Button onClick={dismiss} className="w-full rounded-xl">
          Tamam, başlayalım!
        </Button>
      </div>
    </div>
  );
}
