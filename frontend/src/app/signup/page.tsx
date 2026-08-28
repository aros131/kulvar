'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'İsim zorunludur.';
    else if (name.trim().length < 2) next.name = 'İsim en az 2 karakter olmalı.';
    if (!email.trim()) next.email = 'E-posta zorunludur.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Geçerli bir e-posta girin.';
    if (!password) next.password = 'Şifre zorunludur.';
    else if (password.length < 6) next.password = 'Şifre en az 6 karakter olmalı.';
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
        setServerError(data.message || 'Kayıt başarısız.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);

      router.push(data.user.role === 'coach' ? '/dashboard/coach' : '/dashboard/user');
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
          <p className="text-sm text-muted-foreground mt-1">Hesap oluştur, koçluk yolculuğuna başla.</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold">Kayıt Ol</h2>

          {serverError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">İsim Soyisim</Label>
            <Input
              id="name"
              placeholder="Adınız Soyadınız"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

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
              placeholder="En az 6 karakter"
              value={password}
              onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <Label>Hesap Türü</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Kullanıcı — antrenman takibi, koç bul</SelectItem>
                <SelectItem value="coach">Koç — program oluştur, danışan yönet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Giriş Yap
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
