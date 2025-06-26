"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const products = [
  {
    title: 'Fitness',
    description: 'Güçlü bir vücut için kişiselleştirilmiş planlar.',
    image: '/images/fitness.png',
    link: '/koc?category=fitness',
  },
  {
    title: 'Yoga',
    description: 'Esneklik ve mindfulness için uzman rehberliği.',
    image: '/images/yoga.png',
    link: '/koc?category=yoga',
  },
  {
    title: 'Pilates',
    description: 'Denge, esneklik ve güç için pilates programları.',
    image: '/images/pilates.png',
    link: '/koc?category=pilates',
  },
  {
    title: 'Beslenme',
    description: 'Sağlıklı bir yaşam için kişisel diyet planları.',
    image: '/images/beslenme.png',
    link: '/koc?category=beslenme',
  },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [productIndex, setProductIndex] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProductIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setProductIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setProductIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-poppins transition-colors duration-500">
      <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-zinc-800">
        <Link href="/">
          <Image src="/images/logo.png" alt="Logo" width={100} height={80} />
        </Link>
        <ul className="hidden md:flex gap-6">
          <li><a href="#hero" className="hover:underline">Anasayfa</a></li>
          <li><a href="#features" className="hover:underline">Koçlarımız</a></li>
          <li><a href="#contact" className="hover:underline">İletişim</a></li>
          <li><Link href="/login" className="hover:underline">Giriş Yap</Link></li>
        </ul>
        <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
          {darkMode ? <Sun /> : <Moon />}
        </Button>
      </nav>

      <section id="hero" className="text-center py-20 px-4 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
        <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-5xl font-bold mb-4">PerSe Coaching</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-lg mb-6">Başla, bırakma.</motion.p>
        <Image src="/images/hero.jpg" alt="Hero" width={500} height={250} className="mx-auto rounded-lg shadow-md mb-6" />
        <Button onClick={() => window.location.href = '#features'}>Keşfet</Button>
      </section>

      <section id="features" className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-4">Neden Kullanmalısın?</h2>
        <p className="text-center text-zinc-600 dark:text-zinc-300 mb-12">Doğru programı bulmakta ve motive olmakta zorlandığını biliyoruz. Buna son vermek için buradayız.</p>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="text-center">
            <Image src="/images/community.jpg" alt="Topluluk" width={300} height={200} className="rounded-2xl mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Topluluk</h3>
            <p className="text-zinc-600 dark:text-zinc-300">Diğer sporcular ve koçlar ile iletişim kurun.</p>
          </div>
          <div className="text-center">
            <Image src="/images/progress.jpg" alt="İlerleme" width={300} height={200} className="rounded-2xl mx-auto" />
            <h3 className="text-xl font-semibold mt-4">İlerleme Takibi</h3>
            <p className="text-zinc-600 dark:text-zinc-300">Performansınızı ve hedeflerinizi kolayca takip edin.</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-zinc-50 dark:bg-zinc-800">
        <h2 className="text-2xl font-bold text-center mb-6">Kategoriler</h2>
        <div className="relative max-w-md mx-auto overflow-hidden">
          <div className="transition-transform duration-500">
            <div className="text-center bg-white dark:bg-zinc-700 rounded-lg p-4 shadow-md">
              <Image src={products[productIndex].image} alt={products[productIndex].title} width={160} height={130} className="mx-auto mb-3 rounded-md" />
              <h3 className="text-lg font-semibold mb-1">{products[productIndex].title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">{products[productIndex].description}</p>
              <Link href={products[productIndex].link} className="inline-block bg-zinc-700 hover:bg-zinc-800 text-white text-sm px-3 py-1.5 rounded-md transition">Koçları Gör</Link>
            </div>
          </div>
          <button onClick={handlePrev} className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 text-zinc-600 dark:text-white"><ChevronLeft size={20} /></button>
          <button onClick={handleNext} className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-zinc-600 dark:text-white"><ChevronRight size={20} /></button>
        </div>
      </section>

      <footer className="bg-zinc-100 dark:bg-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Hakkında</h4>
            <p>© 2024 Kas yap Platformu. Tüm hakları saklıdır.</p>
          </div>
          <div className="space-y-2">
            <Link href="/privacy.html">Gizlilik Politikası</Link><br />
            <Link href="/contact.html">Bize ulaşın</Link><br />
            <Link href="/admin_login.html">Admin Girişi</Link>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bizi Takip Et</h4>
            <div className="flex gap-4">
              <Image src="/images/facebook.svg" alt="Facebook" width={24} height={24} />
              <Image src="/images/twitter.svg" alt="Twitter" width={24} height={24} />
              <Image src="/images/instagram.svg" alt="Instagram" width={24} height={24} />
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-zinc-700 hover:bg-zinc-800 text-white p-2 rounded-full shadow-lg"
        aria-label="Back to top"
      >⬆</button>

      <div className="fixed bottom-20 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => {
              const el = document.getElementById('chatPopup');
              if (el) el.classList.toggle('hidden');
            }}
            className="bg-zinc-700 hover:bg-zinc-800 text-white p-3 rounded-full shadow-md"
          >💬</button>
          <div id="chatPopup" className="hidden absolute bottom-14 right-0 w-72 bg-white dark:bg-zinc-700 text-sm rounded-lg shadow-lg p-4">
            <header className="font-bold mb-2">Canlı Destek</header>
            <div className="mb-2">Merhaba! Size nasıl yardımcı olabiliriz?</div>
            <textarea className="w-full border dark:border-zinc-600 rounded p-1" placeholder="Mesajınızı yazın..."></textarea>
          </div>
        </div>
      </div>
    </main>
  );
}
