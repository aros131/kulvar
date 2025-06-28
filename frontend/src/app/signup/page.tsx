'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // veya 'coach'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('https://kulvar-qb7t.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Kayıt başarısız.');
        return;
      }

      localStorage.setItem('token', data.token);

      if (data.user.role === 'user') {
        router.push(`/user?id=${data.user.id}`);
      } else if (data.user.role === 'coach') {
        router.push(`/coach?id=${data.user.id}`);
      }

    } catch (err: unknown) {
      console.error('Signup error:', err);
      setErrorMsg('Sunucu hatası oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <form onSubmit={handleSignup} className="w-full max-w-md bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg space-y-5">
        <h2 className="text-2xl font-bold text-center">Kayıt Ol</h2>
        {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
        <input
          type="text"
          placeholder="İsim"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-3 rounded border dark:bg-zinc-700 dark:text-white"
        />
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
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full p-3 rounded border dark:bg-zinc-700 dark:text-white"
        >
          <option value="user">Kullanıcı</option>
          <option value="coach">Koç</option>
        </select>
        <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-800 text-white py-2 rounded">
          Kayıt Ol
        </button>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
          Zaten hesabınız var mı? <a href="/login" className="text-indigo-600 underline">Giriş Yap</a>
        </p>
      </form>
    </div>
  );
}
