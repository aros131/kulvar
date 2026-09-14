'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const t = useTranslations('auth');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) { setError(t('resetPassword.invalidLink')); return; }
    if (newPassword.length < 6) { setError(t('resetPassword.tooShort')); return; }
    if (newPassword !== confirmPassword) { setError(t('resetPassword.mismatch')); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('resetPassword.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
      <div className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))]">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('brand')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('resetPassword.subtitle')}</p>
        </div>

        <div className="bg-card dark:bg-primary/90 rounded-2xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold">{t('resetPassword.heading')}</h2>

          {done ? (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
              {t('resetPassword.doneMessage')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="newPassword">{t('resetPassword.newPasswordLabel')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t('resetPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
