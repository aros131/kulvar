"use client";
import dynamic from "next/dynamic";
const LottieTopluluk = dynamic(() => import("@/components/LottieTopluluk"), { ssr: false });
const LottieIlerleme = dynamic(() => import("@/components/LottieIlerleme"), { ssr: false });
const LottieHero = dynamic(() => import("@/components/LottieHero"), { ssr: false });

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import {
  Gym,
  Yoga,
  Stretching,
  Apple,
} from "iconoir-react";
import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

const products = [
  {
    title: "Fitness",
    description: "Güçlü bir vücut için kişiselleştirilmiş planlar.",
    icon: <Gym width={40} height={40} />,
    link: "/koc?specialization=fitness",
  },
  {
    title: "Yoga",
    description: "Esneklik ve mindfulness için uzman rehberliği.",
    icon: <Yoga width={40} height={40} />,
    link: "/koc?specialization=yoga",
  },
  {
    title: "Pilates",
    description: "Denge, esneklik ve güç için pilates programları.",
    icon: <Stretching width={40} height={40} />,
    link: "/koc?specialization=pilates",
  },
  {
    title: "Beslenme",
    description: "Sağlıklı bir yaşam için kişisel diyet planları.",
    icon: <Apple width={40} height={40} />,
    link: "/koc?specialization=beslenme",
  },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTag, setActiveTag] = useState("Tümü");

  const allTags = ["Tümü", "Fitness", "Yoga", "Pilates", "Beslenme"];

  const filteredProducts =
    activeTag === "Tümü"
      ? products
      : products.filter(
          (p) =>
            p.title.toLowerCase() === activeTag.toLowerCase()
        );

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored) setDarkMode(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      setActiveTag((prev) => {
        const currentIndex = allTags.indexOf(prev);
        return allTags[(currentIndex + 1) % allTags.length];
      });
    },
    onSwipedDown: () => {
      setActiveTag((prev) => {
        const currentIndex = allTags.indexOf(prev);
        return allTags[(currentIndex - 1 + allTags.length) % allTags.length];
      });
    },
    trackTouch: true,
  });

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-poppins transition-colors duration-500">
      <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white dark:bg-zinc-800 relative z-50">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={100}
            height={80}
          />
        </Link>

        <ul className="hidden md:flex gap-6">
          <li><a href="#hero" className="hover:underline">Anasayfa</a></li>
          <li><Link href="/koc?specialization=all" className="hover:underline">Koçlarımız</Link></li>
          <li><Link href="/contact" className="hover:underline">İletişim</Link></li>
          <li><Link href="/login" className="hover:underline">Giriş Yap</Link></li>
        </ul>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
            {darkMode ? <Sun /> : <Moon />}
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 w-full bg-white dark:bg-zinc-800 flex flex-col items-center gap-4 py-4 shadow-md md:hidden"
          >
            <li><a href="#hero" onClick={() => setMobileMenuOpen(false)}>Anasayfa</a></li>
            <li><Link href="/koc?specialization=all" onClick={() => setMobileMenuOpen(false)}>Koçlarımız</Link></li>
            <li><Link href="/contact" onClick={() => setMobileMenuOpen(false)}>İletişim</Link></li>
            <li><Link href="/login" onClick={() => setMobileMenuOpen(false)}>Giriş Yap</Link></li>
          </motion.ul>
        )}
      </nav>
      <section
  id="hero"
  className="relative h-[80vh] bg-cover bg-center bg-no-repeat flex items-center"
  style={{ backgroundImage: "url('/images/herobackground.jpg')" }}
>
  <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col md:flex-row items-start justify-start">
    {/* LEFT CONTENT: Text + Animation + Buttons */}
    <div className="w-full md:w-1/2 text-white">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold mb-4"
      >
        
        PerSe Coaching
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-lg text-white/90 mb-6 max-w-xl"
      >
        
        Hedeflerini keşfet, programını seç, birlikte başaralım.
      </motion.p>

      {/* Lottie animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mb-6"
      >
        <LottieHero />
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="flex gap-4 flex-col sm:flex-row"
      >
        <Button onClick={() => window.location.href = '/koc'}>
          Koçlarla Tanış
        </Button>
        <Button
          variant="outline"
          className="border-white text-black hover:bg-white hover:text-black"
          onClick={() => window.location.href = '#features'}
        >
          Daha Fazla Bilgi
        </Button>
      </motion.div>
    </div>

    {/* RIGHT EMPTY / placeholder */}
    <div className="hidden md:block md:w-1/2" />
  </div>
</section>

      
      <section className="py-16 px-4 bg-zinc-50 dark:bg-zinc-800" {...swipeHandlers}>
        <h2 className="text-2xl font-bold text-center mb-6">Kategoriler</h2>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1 rounded-full text-sm border transition ${
                tag === activeTag
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-white border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.title}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-700 p-5 rounded-xl shadow-md flex flex-col items-center text-center"
            >
              <div className="text-zinc-800 dark:text-white mb-3">
                {product.icon}
              </div>
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-300 mb-3">
                {product.description}
              </p>
              <Link
                href={product.link}
                className="text-sm font-medium text-white bg-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-900"
              >
                Koçları Gör
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6 md:hidden">
          Yukarı/Aşağı kaydırarak kategoriler arasında geçiş yapabilirsin
        </p>
      </section>

      <Footer />

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-zinc-700 hover:bg-zinc-800 text-white p-2 rounded-full shadow-lg"
        aria-label="Back to top"
      >
        ⬆
      </button>
    </main>
  );
}
