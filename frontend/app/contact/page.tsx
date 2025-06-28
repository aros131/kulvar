'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: integrate with backend or Formspree
  };

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <nav className="bg-white dark:bg-zinc-800 shadow-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">PerSe Coaching</Link>
        <ul className="hidden md:flex space-x-6">
          <li><Link href="/" className="hover:underline">Anasayfa</Link></li>
          <li><Link href="/koc" className="hover:underline">Koçlarımız</Link></li>
          <li><Link href="/contact" className="underline text-indigo-600">İletişim</Link></li>
        </ul>
      </nav>

      <section className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Bize Ulaşın</h1>
        <p className="text-center text-zinc-600 dark:text-zinc-300 mb-10">
          Herhangi bir sorunuz, öneriniz veya iş birliği teklifiniz için bizimle iletişime geçebilirsiniz.
        </p>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block mb-2 font-medium">Adınız</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-2 font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="message" className="block mb-2 font-medium">Mesajınız</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            ></textarea>
          </div>

          <Button type="submit" className="w-full">Gönder</Button>
        </form>
      </section>

      <footer className="bg-zinc-200 dark:bg-zinc-800 py-6 mt-16 text-center text-sm text-zinc-600 dark:text-zinc-300">
        © 2025 PerSe Coaching. Tüm hakları saklıdır.
      </footer>
    </main>
  );
}
