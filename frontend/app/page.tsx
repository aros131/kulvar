"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ChevronLeft, ChevronRight, MessageSquare, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const categories = [
  {
    title: 'Fitness',
    desc: 'Güçlü bir vücut için kişiselleştirilmiş planlar.',
    image: '/images/fitness.png',
    link: 'koc.html?category=fitness'
  },
  {
    title: 'Yoga',
    desc: 'Esneklik ve mindfulness için uzman rehberliği.',
    image: '/images/yoga.png',
    link: 'koc.html?category=yoga'
  },
  {
    title: 'Pilates',
    desc: 'Denge, esneklik ve güç için pilates programları.',
    image: '/images/pilates.png',
    link: 'koc.html?category=pilates'
  },
  {
    title: 'Beslenme',
    desc: 'Sağlıklı bir yaşam için kişisel diyet planları.',
    image: '/images/beslenme.png',
    link: 'koc.html?category=beslenme'
  },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-poppins transition-colors duration-500 relative">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-zinc-800 relative z-10">
        <a href="/">
          <Image src="/images/logo.png" alt="Logo" width={100} height={80} />
        </a>
        <ul className={`hidden md:flex gap-6`}>
          <li><a href="#hero" className="hover:underline">Anasayfa</a></li>
          <li><a href="#features" className="hover:underline">Koçlarımız</a></li>
          <li><a href="#contact" className="hover:underline">İletişim</a></li>
          <li><a href="/login.html" className="hover:underline">Giriş Yap</a></li>
        </ul>
        <div className="md:hidden flex gap-2 items-center">
          <Button size="icon" variant="ghost" onClick={() => setMobileNavOpen(!mobileNavOpen)}>☰</Button>
          <Button size="icon" variant="ghost" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun /> : <Moon />}
          </Button>
        </div>
        {mobileNavOpen && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-800 shadow-md md:hidden flex flex-col p-4 gap-2">
            <a href="#hero">Anasayfa</a>
            <a href="#features">Koçlarımız</a>
            <a href="#contact">İletişim</a>
            <a href="/login.html">Giriş Yap</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="text-center py-20 px-4 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
        <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4">PerSe Coaching</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg mb-6">Başla, bırakma.</motion.p>
        <Button onClick={() => window.location.href = '#features'}>Keşfet</Button>
      </section>

      {/* Features */}
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

      {/* Product Carousel */}
      <section className="bg-zinc-50 dark:bg-zinc-800 py-12">
        <h2 className="text-center text-2xl font-semibold mb-6">Kategoriler</h2>
        <div className="relative max-w-5xl mx-auto flex items-center justify-center">
          <Button size="icon" variant="ghost" onClick={() => setCategoryIndex((prev) => Math.max(prev - 1, 0))}><ChevronLeft /></Button>
          <div className="flex overflow-hidden w-[300px] sm:w-[350px] md:w-[400px]">
            {categories.map((item, idx) => (
              <div key={item.title} className={`shrink-0 w-full transition-transform duration-500 transform ${idx === categoryIndex ? 'translate-x-0' : idx < categoryIndex ? '-translate-x-full' : 'translate-x-full'}`}>
                <Image src={item.image} alt={item.title} width={400} height={250} className="rounded-xl" />
                <h3 className="text-xl font-semibold mt-2 text-center">{item.title}</h3>
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">{item.desc}</p>
                <div className="text-center mt-2">
                  <a className="underline text-blue-500" href={item.link}>Koçları Gör</a>
                </div>
              </div>
            ))}
          </div>
          <Button size="icon" variant="ghost" onClick={() => setCategoryIndex((prev) => Math.min(prev + 1, categories.length - 1))}><ChevronRight /></Button>
        </div>
      </section>

      {/* Chat & Back to Top */}
      {showBackToTop && (
        <Button className="fixed bottom-6 right-6 z-50" size="icon" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp /></Button>
      )}

      <div className="fixed bottom-6 left-6 z-50">
        <Button size="icon" variant="outline" onClick={() => setChatOpen(!chatOpen)}><MessageSquare /></Button>
      </div>

      {chatOpen && (
        <motion.div className="fixed bottom-20 left-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 shadow-xl w-80"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h4 className="font-semibold mb-2">Live Chat</h4>
          <p className="text-sm mb-2">Merhaba! Size nasıl yardımcı olabiliriz?</p>
          <textarea className="w-full rounded-md border px-2 py-1 text-sm" placeholder="Mesajınızı yazın..." rows={3}></textarea>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-100 dark:bg-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Hakkında</h4>
            <p>© 2024 Kas yap Platformu. Tüm hakları saklıdır.</p>
          </div>
          <div className="space-y-2">
            <a href="/privacy.html">Gizlilik Politikası</a><br />
            <a href="/contact.html">Bize ulaşın</a><br />
            <a href="/admin_login.html">Admin Girişi</a>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bizi Takip Et</h4>
            <div className="flex gap-4">
              <a href="https://facebook.com"><Image src="/images/facebook.svg" alt="Facebook" width={24} height={24} /></a>
              <a href="https://twitter.com"><Image src="/images/twitter.svg" alt="Twitter" width={24} height={24} /></a>
              <a href="https://instagram.com"><Image src="/images/instagram.svg" alt="Instagram" width={24} height={24} /></a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
