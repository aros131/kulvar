"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import TreeBackground from "@/components/TreeBackground";
import PublicNavbar from "@/components/nav/PublicNavbar";
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

const FEATURE_ICONS = [Search, ClipboardList, MessageCircle, TrendingUp, CalendarCheck, Bell];

export default function LandingPage() {
  const root = useRef<HTMLDivElement | null>(null);
  const t = useTranslations("landing");

  const marquee = t.raw("marquee") as string[];
  const featureItems = t.raw("features.items") as { title: string; desc: string }[];
  const steps = t.raw("howItWorks.steps") as { title: string; desc: string }[];

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
      const marqueeEl = document.querySelector(".marquee-track");
      if (marqueeEl) {
        const width = (marqueeEl as HTMLElement).scrollWidth / 2;
        gsap.to(marqueeEl, { x: -width, repeat: -1, ease: "none", duration: 30 });
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

      <PublicNavbar />

      {/* HERO */}
      <section id="hero" className="relative isolate min-h-[92dvh] overflow-hidden flex items-end pb-20 md:items-center md:pb-0">
        <TreeBackground />

        <div className="container mx-auto px-6 md:px-10">
          <div className="max-w-4xl">
            <p className="hero-eyebrow inline-block mb-4 text-xs font-semibold tracking-[0.2em] text-primary">
              {t("hero.eyebrow")}
            </p>
            <h1 className="hero-title text-6xl md:text-8xl font-black text-foreground leading-[0.95] tracking-tight">
              {t("hero.titleLine1")}<br />{t("hero.titleLine2")}
            </h1>
            <p className="hero-subtitle mt-6 text-base md:text-lg font-medium text-muted-foreground max-w-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="hero-cta mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/koc"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 select-none overflow-hidden">
          <div className="marquee-track flex gap-10 whitespace-nowrap will-change-transform text-xs tracking-widest text-foreground/25 uppercase">
            {[...marquee, ...marquee].map((text, i) => (
              <span key={i}>{text}</span>
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
              <p className="text-xs tracking-widest text-rose-900/70 uppercase mb-4">{t("features.eyebrow")}</p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                {t("features.titleLine1")}<br />{t("features.titleLine2")}
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                {t("features.subtitle")}
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-rose-900/70 hover:gap-3 transition-all"
              >
                {t("features.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right feature list */}
            <div className="md:col-span-3 divide-y">
              {featureItems.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
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
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {steps.map((s, i) => (
              <div key={i} data-animate="fade-up" className="py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0 flex flex-col gap-6">
                <span className="text-7xl font-black text-white/15 leading-none select-none">{String(i + 1).padStart(2, "0")}</span>
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
          <p className="text-xs tracking-widest text-rose-900/70 uppercase mb-4">{t("dualCta.eyebrow")}</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {t("dualCta.titleLine1")}<br />{t("dualCta.titleLine2")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Coach */}
          <div data-animate="fade-up" className="rounded-3xl bg-foreground dark:bg-zinc-900 p-10 flex flex-col gap-8 min-h-[360px]">
            <div className="flex-1">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">{t("dualCta.coach.label")}</p>
              <h3 className="text-3xl font-black text-white leading-tight mb-4">{t("dualCta.coach.titleLine1")}<br/>{t("dualCta.coach.titleLine2")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("dualCta.coach.desc")}
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/50 px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              {t("dualCta.coach.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* User */}
          <div data-animate="fade-up" className="rounded-3xl border-2 border-rose-900/20 p-10 flex flex-col gap-8 min-h-[360px]">
            <div className="flex-1">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">{t("dualCta.user.label")}</p>
              <h3 className="text-3xl font-black leading-tight mb-4">{t("dualCta.user.titleLine1")}<br/>{t("dualCta.user.titleLine2")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("dualCta.user.desc")}
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 dark:bg-zinc-100 px-6 py-3 text-sm font-medium text-white dark:text-foreground hover:bg-primary/80 dark:hover:bg-card transition-colors"
            >
              {t("dualCta.user.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
