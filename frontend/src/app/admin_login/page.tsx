'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin-login', { // Adjust this if you have a dedicated admin endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Giriş başarısız.');
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin-dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg('Bir hata oluştu.');
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
        <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-800 text-white py-2 rounded">
          Giriş Yap
        </button>
      </form>
    </main>
  );
}
