'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PublicNavbar from '@/components/nav/PublicNavbar';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export default function ContactPage() {
  const t = useTranslations('contact');
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
      toast.success(t('toastSuccess'));
    } catch {
      toast.error(t('toastError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <PublicNavbar />

      <section className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">{t('heading')}</h1>
        <p className="text-center text-muted-foreground dark:text-zinc-300 mb-10">
          {t('subtitle')}
        </p>

        {sent && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-4 text-green-700 dark:text-green-300 text-center mb-6">
            {t('successBanner')}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-card dark:bg-primary/90 rounded-lg shadow-md p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block mb-2 font-medium">{t('nameLabel')}</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-primary/80 dark:border-zinc-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-2 font-medium">{t('emailLabel')}</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-primary/80 dark:border-zinc-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="message" className="block mb-2 font-medium">{t('messageLabel')}</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3 rounded border dark:bg-primary/80 dark:border-zinc-600 dark:text-white"
            ></textarea>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('submitting') : t('submit')}
          </Button>
        </form>
      </section>

      <footer className="bg-zinc-200 dark:bg-primary/90 py-6 mt-16 text-center text-sm text-muted-foreground dark:text-zinc-300">
        {t('footer')}
      </footer>
    </main>
  );
}
