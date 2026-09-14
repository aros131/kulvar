'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { signInToFirebase, registerPushNotifications } from '@/lib/firebase';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t('validation.nameRequired');
    else if (name.trim().length < 2) next.name = t('validation.nameTooShort');
    if (!email.trim()) next.email = t('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('validation.emailInvalid');
    if (!password) next.password = t('validation.passwordRequired');
    else if (password.length < 6) next.password = t('validation.passwordTooShort');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || t('signup.errorGeneric'));
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);

      await signInToFirebase(data.token);
      registerPushNotifications(data.token);

      router.push(data.user.role === 'coach' ? '/dashboard/coach' : '/dashboard/user');
    } catch {
      setServerError(t('signup.errorServer'));
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
          <p className="text-sm text-muted-foreground mt-1">{t('signup.subtitle')}</p>
        </div>

        <form onSubmit={handleSignup} className="bg-card dark:bg-primary/90 rounded-2xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold">{t('signup.heading')}</h2>

          {serverError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">{t('signup.nameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('signup.namePlaceholder')}
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">{t('signup.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('signup.emailPlaceholder')}
              value={email}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">{t('signup.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('signup.passwordPlaceholder')}
              value={password}
              onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <Label>{t('signup.roleLabel')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('signup.roleUser')}</SelectItem>
                <SelectItem value="coach">{t('signup.roleCoach')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signup.submitting') : t('signup.submit')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('signup.hasAccount')}{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t('signup.loginLink')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
