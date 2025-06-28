"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
const products = [
  {
    title: 'Fitness',
    description: 'Güçlü bir vücut için kişiselleştirilmiş planlar.',
    image: '/images/fitness.png',
    link: '/koc?specialization=fitness',
  },
  {
    title: 'Yoga',
    description: 'Esneklik ve mindfulness için uzman rehberliği.',
    image: '/images/yoga.png',
    link: '/koc?specialization=yoga',
  },
  {
    title: 'Pilates',
    description: 'Denge, esneklik ve güç için pilates programları.',
    image: '/images/pilates.png',
    link: '/koc?specialization=pilates',
  },
  {
    title: 'Beslenme',
    description: 'Sağlıklı bir yaşam için kişisel diyet planları.',
    image: '/images/beslenme.png',
    link: '/koc?specialization=beslenme',
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
          <li>
            <Link href="/koc?specialization=all" className="hover:underline">Koçlarımız</Link>
          </li>
          <li>
            <Link href="/contact" className="hover:underline">İletişim</Link>
          </li>
          <li>
            <Link href="/login" className="hover:underline">Giriş Yap</Link>
          </li>
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
              <Image src={products[productIndex].image} alt={products[productIndex].title} width={120} height={100} className="mx-auto mb-3 rounded-md" /> {/* ✅ smaller image */}
              <h3 className="text-lg font-semibold mb-1">{products[productIndex].title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">{products[productIndex].description}</p>
              <Link href={products[productIndex].link} className="inline-block bg-zinc-700 hover:bg-zinc-800 text-white text-sm px-3 py-1.5 rounded-md transition">Koçları Gör</Link>
            </div>
          </div>
          <button onClick={handlePrev} className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 text-zinc-600 dark:text-white"><ChevronLeft size={20} /></button>
          <button onClick={handleNext} className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-zinc-600 dark:text-white"><ChevronRight size={20} /></button>
        </div>
      </section>

      {/* Footer remains unchanged here, consider extracting to <Footer /> component later for reusability */}
<Footer />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-zinc-700 hover:bg-zinc-800 text-white p-2 rounded-full shadow-lg"
        aria-label="Back to top"
      >⬆</button>

      {/* Chat popup remains unchanged */}
    </main>
  );
}
