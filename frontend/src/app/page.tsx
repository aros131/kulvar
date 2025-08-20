"use client";

import HoverOverlayTriptych from "@/components/HoverOverlayTriptych";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "@/components/Footer";

export default function HomePage() {
  const root = useRef<HTMLDivElement | null>(null);

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
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-4 bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-[-1]" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/30" />
        <div className="flex items-center justify-between w-full">
          <div className="text-2xl font-bold text-white">PerSe.</div>
          <ul className="hidden md:flex gap-6 text-white">
            <li><a href="#hero" className="hover:underline">Anasayfa</a></li>
            <li><Link href="/koc">Koçlarımız</Link></li>
            <li><Link href="/contact">İletişim</Link></li>
            <li><Link href="/login">Giriş Yap</Link></li>
          </ul>
        </div>
      </nav>

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
              PerSe. <span className="opacity-90">
                Başla,</span> bırakma.
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
                className="rounded-2xl border-white/30 text-black hover:bg-white/10"
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
