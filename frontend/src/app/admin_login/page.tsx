'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Giriş başarısız.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);
      router.push('/admin-dashboard');
    } catch {
      setErrorMsg('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Girişi</h1>
        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded border dark:bg-zinc-700 dark:text-white"
        />
        <input
          type="password"
          placeholder="Şifre"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded border dark:bg-zinc-700 dark:text-white"
        />
        <button type="submit" disabled={loading} className="w-full bg-zinc-700 hover:bg-zinc-800 text-white py-2 rounded disabled:opacity-60">
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </main>
  );
}
