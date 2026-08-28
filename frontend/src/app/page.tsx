"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer";
import {
  Search,
  ClipboardList,
  MessageCircle,
  TrendingUp,
  CalendarCheck,
  Bell,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  { icon: Search,        title: "Koçunu Bul",          desc: "Uzmanlık alanı, şehir ve değerlendirmeye göre filtrele. Sana en uygun koçu dakikalar içinde keşfet." },
  { icon: ClipboardList, title: "Kişisel Program",      desc: "Koçun sana özel antrenman ve beslenme programları hazırlar. Her hafta güncel, her gün takip edilebilir." },
  { icon: MessageCircle, title: "Anlık Mesajlaşma",     desc: "Koçunla gerçek zamanlı iletişim kur. Sorularını sor, geri bildirim al, motive kal." },
  { icon: TrendingUp,    title: "İlerleme Takibi",      desc: "Haftalık ve aylık bazda gelişimini görsel olarak izle. Nerede durduğunu her zaman bil." },
  { icon: CalendarCheck, title: "Randevu Yönetimi",     desc: "Koçunla seans planla, onaylı randevuları takvimine ekle, hatırlatıcı bildirimler al." },
  { icon: Bell,          title: "Akıllı Bildirimler",   desc: "Program güncellemeleri, randevu onayları ve yeni mesajlar için anında bildirim." },
];

export default function HomePage() {
  const root = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from([".hero-eyebrow", ".hero-title", ".hero-subtitle", ".hero-cta"], {
        opacity: 0, y: 24, duration: 0.9, ease: "power3.out", stagger: 0.12,
      });
      gsap.to(".hero-bg", {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "+=60%", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>("[data-animate='fade-up']").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0, y: 32, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
        });
      });
      const marquee = document.querySelector(".marquee-track");
      if (marquee) {
        const width = (marquee as HTMLElement).scrollWidth / 2;
        gsap.to(marquee, { x: -width, repeat: -1, ease: "none", duration: 30 });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    if (window.location.hash) return;
    const OFFSET = Math.min(120, Math.round(window.innerHeight * 0.08));
    requestAnimationFrame(() => {
      window.scrollTo({ top: OFFSET, behavior: "auto" });
      try { ScrollTrigger.refresh(); } catch {}
    });
  }, []);

  return (
    <div ref={root} className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}
      <nav className="absolute md:fixed top-0 left-0 w-full z-[60] px-6 py-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">PerSe.</Link>
          <ul className="hidden md:flex gap-6 text-sm text-white/90">
            <li><Link href="/koc" className="hover:text-white transition-colors">Koçlarımız</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">İletişim</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Giriş Yap</Link></li>
            <li>
              <Link href="/signup" className="rounded-full border border-white/30 px-4 py-1.5 hover:bg-card/10 transition-colors">
                Kaydol
              </Link>
            </li>
          </ul>
          <button
            aria-label="Menüyü aç"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-card/10 text-white backdrop-blur border border-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              {menuOpen
                ? <path fillRule="evenodd" d="M18.3 5.7a1 1 0 0 1 0 1.4L13.4 12l4.9 4.9a1 1 0 1 1-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 1 1-1.4-1.4L10.6 12 5.7 7.1A1 1 0 0 1 7.1 5.7L12 10.6l4.9-4.9a1 1 0 0 1 1.4 0z" clipRule="evenodd"/>
                : <><path d="M4 6h16v2H4z"/><path d="M4 11h16v2H4z"/><path d="M4 16h16v2H4z"/></>
              }
            </svg>
          </button>
          {menuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/15 bg-foreground/80 backdrop-blur p-4 text-white text-sm">
              <Link href="/koc" className="block px-3 py-2.5 rounded-lg hover:bg-card/10" onClick={() => setMenuOpen(false)}>Koçlarımız</Link>
              <Link href="/contact" className="block px-3 py-2.5 rounded-lg hover:bg-card/10" onClick={() => setMenuOpen(false)}>İletişim</Link>
              <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                <Link href="/login" className="flex-1 text-center rounded-xl border border-white/20 px-3 py-2 hover:bg-card/10" onClick={() => setMenuOpen(false)}>Giriş Yap</Link>
                <Link href="/signup" className="flex-1 text-center rounded-xl bg-card text-foreground px-3 py-2 font-medium" onClick={() => setMenuOpen(false)}>Kaydol</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="hidden md:block h-16" />

      {/* HERO */}
      <section id="hero" className="relative isolate min-h-[92dvh] overflow-hidden flex items-end pb-20 md:items-center md:pb-0">
        <div
          data-aifx="halftone"
          className="hero-bg absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 md:px-10">
          <div className="max-w-4xl">
            <p className="hero-eyebrow inline-block mb-4 text-xs tracking-[0.2em] text-white/60 uppercase">
              PerSe Coaching
            </p>
            <h1 className="hero-title text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tight">
              Başla,<br />bırakma.
            </h1>
            <p className="hero-subtitle mt-6 text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
              Koçunu bul, programını takip et, ilerlemeyi hızlandır. Türkiye'nin modern koçluk platformu.
            </p>
            <div className="hero-cta mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-rose-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-rose-800 transition-colors"
              >
                Ücretsiz Başla <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/koc"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white hover:bg-card/10 transition-colors"
              >
                Koçları Keşfet
              </Link>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 select-none overflow-hidden">
          <div className="marquee-track flex gap-10 whitespace-nowrap will-change-transform text-xs tracking-widest text-white/30 uppercase">
            {["Koç Keşfet","Program Takibi","Anlık Mesajlaşma","Randevu Yönetimi","İlerleme Grafikleri","Koç Değerlendirme","Akıllı Bildirimler",
              "Koç Keşfet","Program Takibi","Anlık Mesajlaşma","Randevu Yönetimi","İlerleme Grafikleri","Koç Değerlendirme","Akıllı Bildirimler"].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — sticky split */}
      <section id="features" className="border-t">
        <div className="container mx-auto px-6 md:px-10">
          <div className="md:grid md:grid-cols-5 md:gap-16">

            {/* Left sticky col */}
            <div className="md:col-span-2 py-16 md:py-24 md:sticky md:top-24 md:self-start" data-animate="fade-up">
              <p className="text-xs tracking-widest text-rose-900/70 uppercase mb-4">Platform</p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Her şey<br />tek yerde.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Koçluk sürecini baştan sona yönetmen için ihtiyacın olan tüm araçlar tek bir çatı altında.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-rose-900/70 hover:gap-3 transition-all"
              >
                Hemen başla <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right feature list */}
            <div className="md:col-span-3 divide-y">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} data-animate="fade-up" className="py-8 flex gap-5 group">
                    <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center group-hover:border-rose-900/25 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-rose-900/70 transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS — dark */}
      <section className="bg-foreground text-white">
        <div className="container mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16" data-animate="fade-up">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Nasıl çalışır?</h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Kayıttan ilk randevuya kadar her adım sezgisel ve hızlı.
            </p>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            {[
              { n: "01", title: "Hesap Oluştur",              desc: "Koç veya danışan olarak ücretsiz kaydol." },
              { n: "02", title: "Koçunu veya Programı Bul",   desc: "Hedefine uygun koçu bul ya da koçsan kendi programını oluştur." },
              { n: "03", title: "Takip Et ve Büyü",           desc: "İlerlemeni görsel olarak izle, geri bildirim al, gelişimini hızlandır." },
            ].map((s) => (
              <div key={s.n} data-animate="fade-up" className="py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0 flex flex-col gap-6">
                <span className="text-7xl font-black text-foreground leading-none select-none">{s.n}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUAL CTA */}
      <section className="container mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="mb-14" data-animate="fade-up">
          <p className="text-xs tracking-widest text-rose-900/70 uppercase mb-4">Başla</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Nereden başlamak<br />istiyorsun?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Coach */}
          <div data-animate="fade-up" className="rounded-3xl bg-foreground dark:bg-zinc-900 p-10 flex flex-col gap-8 min-h-[360px]">
            <div className="flex-1">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">Koçsanız</p>
              <h3 className="text-3xl font-black text-white leading-tight mb-4">Danışanlarını<br/>büyüt.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Program oluştur, ilerlemeyi takip et, mesajlaş. Tüm koçluk sürecini tek yerden yürüt.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/50 px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Koç Olarak Başla <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* User */}
          <div data-animate="fade-up" className="rounded-3xl border-2 border-rose-900/20 p-10 flex flex-col gap-8 min-h-[360px]">
            <div className="flex-1">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">Danışansanız</p>
              <h3 className="text-3xl font-black leading-tight mb-4">Hedeflerine<br/>ulaş.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sana özel koçunu bul, kişisel programını al ve adım adım ilerle.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 dark:bg-zinc-100 px-6 py-3 text-sm font-medium text-white dark:text-foreground hover:bg-primary/80 dark:hover:bg-card transition-colors"
            >
              Danışan Olarak Başla <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
