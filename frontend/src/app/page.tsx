"use client";

import HoverOverlayTriptych from "@/components/HoverOverlayTriptych";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer";

export default function HomePage() {
  const root = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // HERO intro
      const tl = gsap.timeline();
      tl.from([".hero-eyebrow", ".hero-title", ".hero-subtitle", ".hero-cta"], {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
      });

      // Parallax
      gsap.to(".hero-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "+=60%",
          scrub: true,
        },
      });

      // Fade-up
      gsap.utils.toArray<HTMLElement>("[data-animate='fade-up']").forEach((el, i) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 36,
          duration: 0.9,
          ease: "power3.out",
          delay: i * 0.03,
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
        });
      });

      // Numbers (counter-up)
      gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((node) => {
        const end = Number(node.getAttribute("data-counter")) || 0;
        const obj = { value: 0 };
        ScrollTrigger.create({
          trigger: node,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              value: end,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                node.textContent = String(Math.round(obj.value));
              },
            });
          },
        });
      });

      // Marquee
      const marquee = document.querySelector(".marquee-track");
      if (marquee) {
        const width = (marquee as HTMLElement).scrollWidth / 2;
        gsap.to(marquee, { x: -width, repeat: -1, ease: "none", duration: 30 });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="min-h-screen bg-background text-foreground">
      {/* NAVBAR (hero üstünde şeffaf) */}
      <nav className="absolute md:fixed top-0 left-0 w-full z-[60] px-6 py-4 bg-transparent">
        {/* subtle gradient to ensure contrast over hero */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="relative flex items-center justify-between w-full">
          <Link href="/" className="text-2xl font-bold text-white">PerSe.</Link>

          {/* Desktop */}
          <ul className="hidden md:flex gap-6 text-white">
            <li><a href="#hero" className="hover:underline">Anasayfa</a></li>
            <li><Link href="/koc">Koçlarımız</Link></li>
            <li><Link href="/contact">İletişim</Link></li>
            <li><Link href="/login">Giriş Yap</Link></li>
          </ul>

          {/* Mobile burger */}
          <button
            aria-label="Menüyü aç"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur border border-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              {menuOpen ? (
                <path fillRule="evenodd" d="M18.3 5.7a1 1 0 0 1 0 1.4L13.4 12l4.9 4.9a1 1 0 1 1-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 1 1-1.4-1.4L10.6 12 5.7 7.1A1 1 0 0 1 7.1 5.7L12 10.6l4.9-4.9a1 1 0 0 1 1.4 0z" clipRule="evenodd"/>
              ) : (
                <><path d="M4 6h16v2H4z"/><path d="M4 11h16v2H4z"/><path d="M4 16h16v2H4z"/></>
              )}
            </svg>
          </button>

          {/* Mobile menu panel */}
          {menuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full mt-3 rounded-2xl border border-white/15 bg-black/70 backdrop-blur p-4 text-white">
              <a href="#hero" className="block px-2 py-2 rounded-lg hover:bg-white/10" onClick={() => setMenuOpen(false)}>Anasayfa</a>
              <Link href="/koc" className="block px-2 py-2 rounded-lg hover:bg-white/10" onClick={() => setMenuOpen(false)}>Koçlarımız</Link>
              <Link href="/contact" className="block px-2 py-2 rounded-lg hover:bg-white/10" onClick={() => setMenuOpen(false)}>İletişim</Link>
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="flex-1 text-center rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Giriş Yap</Link>
                <Link href="/signup" className="flex-1 text-center rounded-xl bg-white text-black px-3 py-2" onClick={() => setMenuOpen(false)}>Kaydol</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* spacer for fixed navbar on very small screens (optional) */}
      <div className="hidden md:block h-16" />

      {/* HERO */}
      <section id="hero" className="relative isolate min-h-[88dvh] overflow-hidden flex items-center">
        {/* Background */}
        <div className="hero-bg absolute inset-0 -z-10">
          <Image
            src="/images/herobackground.jpg"
            alt="PerSe Coaching background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/80" />
        </div>

        <div className="container mx-auto px-6 md:px-10">
          <div className="max-w-3xl">
            <p className="hero-eyebrow inline-block mb-3 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs tracking-wider text-white/80 backdrop-blur">
              PERSE COACHING
            </p>
            <h1 className="hero-title text-5xl md:text-7xl font-extrabold text-white leading-[1.05]">
              PerSe. <span className="opacity-90">Başla,</span> bırakma.
            </h1>
            <p className="hero-subtitle mt-4 text-lg md:text-xl text-white/80">
              Türkiye merkezli modern koçluk platformu: program paylaş, ilerlemeyi takip et, müşterilerinle bağ kur.
            </p>
            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl">
                <Link href="/signup">Hemen Başla</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/30 text-white hover:bg-white/10"
              >
                <Link href="#triptych">Özelliklere Göz At</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 select-none">
          <div className="marquee relative overflow-hidden">
            <div className="marquee-track flex gap-8 whitespace-nowrap will-change-transform px-6 text-sm text-white/70">
              <span>Program Paylaşımı</span><span>•</span>
              <span>İlerleme Takibi</span><span>•</span>
              <span>Mesajlaşma</span><span>•</span>
              <span>Bildirimler</span><span>•</span>
              <span>Beslenme Planları</span><span>•</span>
              <span>Geri Bildirim</span><span>•</span>
              {/* duplicate for seamless loop */}
              <span>Program Paylaşımı</span><span>•</span>
              <span>İlerleme Takibi</span><span>•</span>
              <span>Mesajlaşma</span><span>•</span>
              <span>Bildirimler</span><span>•</span>
              <span>Beslenme Planları</span><span>•</span>
              <span>Geri Bildirim</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRIPTYCH (contained) */}
      <section id="triptych" className="my-16 md:my-24">
        <HoverOverlayTriptych />
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-6 md:px-10 mt-16 md:mt-24 pb-16 md:pb-24">
        <div className="max-w-2xl" data-animate="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold">Nasıl Çalışır?</h2>
          <p className="mt-3 text-muted-foreground">3 adımda başlayın.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { step: 1, title: "Hesap Oluştur", desc: "Koç veya kullanıcı olarak ücretsiz kaydol." },
            { step: 2, title: "Programları Keşfet", desc: "Hedefine uygun programı bul veya oluştur." },
            { step: 3, title: "Takip Et & Büyü", desc: "İlerlemeni takip et, geri bildirim al, gelişimini hızlandır." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border p-6" data-animate="fade-up">
              <div className="text-sm text-muted-foreground">Adım {s.step}</div>
              <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden mt-16 md:mt-24">
        <div className="container mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="rounded-3xl bg-gradient-to-br from-primary/90 to-primary/60 p-10 md:p-14 text-primary-foreground" data-animate="fade-up">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold">Hazır mısın?</h2>
              <p className="mt-2 text-primary-foreground/90">PerSe ile koçluk deneyimini bir üst seviyeye taşı.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="rounded-2xl">
                  <Link href="/signup">Ücretsiz Başla</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl bg-transparent border-white/40 text-white hover:bg-white/10">
                  <Link href="/koc">Koçları Keşfet</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
