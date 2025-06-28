'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    try {
      const res = await fetch('https://kulvar-qb7t.onrender.com/auth/login', {
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

      // ✅ Role-based redirect
      
      if (data.user.role === 'user') {
  router.push(`/dashboard/user?id=${data.user.id}`);
} else if (data.user.role === 'coach') {
  router.push(`/dashboard/coach?id=${data.user.id}`);
}
else {
        setErrorMsg('Tanımlanamayan rol.');
      }

    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMsg('Sunucu hatası oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg space-y-5">
        <h2 className="text-2xl font-bold text-center">Giriş Yap</h2>

        {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}

        <input
          type="email"
          placeholder="E-posta"
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

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
          Hesabınız yok mu? <a href="/signup" className="text-indigo-600 underline">Kayıt Ol</a>
        </p>
      </form>
    </div>
  );
}
