'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createUserIfNotExists } from "@/utils/firestore/createUserIfNotExists";

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'E-posta zorunludur.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Geçerli bir e-posta girin.';
    if (!password) next.password = 'Şifre zorunludur.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || 'Giriş başarısız. E-posta veya şifre hatalı.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;

      await createUserIfNotExists(data.user.id, data.user.name, data.user.role);

      if (data.user.role === 'user') {
        router.push('/dashboard/user');
      } else if (data.user.role === 'coach') {
        router.push('/dashboard/coach');
      } else if (data.user.role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        setServerError('Tanımlanamayan hesap rolü.');
      }
    } catch {
      setServerError('Sunucu hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">PerSe Coaching</h1>
          <p className="text-sm text-muted-foreground mt-1">Hesabınıza giriş yapın.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card dark:bg-primary/90 rounded-2xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold">Giriş Yap</h2>

          {serverError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </Button>

          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">
              Şifremi Unuttum
            </Link>
            <span>
              Hesabınız yok mu?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Kayıt Ol
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
