'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-zinc-800">
      <Link href="/">
        <span className="text-xl font-bold text-indigo-600">PerSe Coaching</span>
      </Link>

      <ul className="hidden md:flex gap-6">
        <li><Link href="/" className="hover:underline">Anasayfa</Link></li>
        <li><Link href="/koc" className="hover:underline">Koçlarımız</Link></li>
        <li><Link href="/contact" className="hover:underline">İletişim</Link></li>
        <li><Link href="/login" className="hover:underline">Giriş Yap</Link></li>
      </ul>

      <button onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
        {darkMode ? <Sun /> : <Moon />}
      </button>
    </nav>
  );
}
