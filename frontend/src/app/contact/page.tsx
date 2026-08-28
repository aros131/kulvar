'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/feedback/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setFormData({ name: '', email: '', message: '' });
      toast.success('Mesajınız iletildi. En kısa sürede dönüş yapacağız.');
    } catch {
      toast.error('Gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
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

        {sent && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-4 text-green-700 dark:text-green-300 text-center mb-6">
            Mesajınız alındı! En kısa sürede size dönüş yapacağız.
          </div>
        )}
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </form>
      </section>

      <footer className="bg-zinc-200 dark:bg-zinc-800 py-6 mt-16 text-center text-sm text-zinc-600 dark:text-zinc-300">
        © 2025 PerSe Coaching. Tüm hakları saklıdır.
      </footer>
    </main>
  );
}
