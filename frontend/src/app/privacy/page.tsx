'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-zinc-800 dark:text-white">Gizlilik Politikası</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-4">
          Bu gizlilik politikası, PerSe Coaching tarafından toplanan ve kullanılan bilgiler hakkında bilgi sağlar...
        </p>
        <p className="text-zinc-600 dark:text-zinc-300 mb-4">
          {/* Insert your full privacy policy text here */}
        </p>

        <Link href="/" className="text-indigo-600 hover:underline">Anasayfaya dön</Link>
      </section>
    </main>
  );
}
