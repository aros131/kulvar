// components/HoverOverlayTriptych.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Panel = {
  title: string;
  desc: string;
  cta: { text: string; href: string };
  // İstersen birine Canva embed ver
  canvaSrc?: string; // "https://www.canva.com/design/XXXX/view?embed"
  bg?: string;       // /images/.. veya gradient class'ı
};

const PANELS: Panel[] = [
  {
    title: "Programlar",
    desc: "Hedefine göre kişisel planlar. Başla, bırakma.",
    cta: { text: "Keşfet", href: "/koc" },
    bg: "url('/images/panel-program.jpg')",
  },
  {
    title: "Tanıtım",
    desc: "Kısa bir önizleme izle ve dene.",
    cta: { text: "Uygulamayı Dene", href: "/kayit" },
    // Canva embed istersen buraya koy:
    // canvaSrc: "https://www.canva.com/design/XXXX/view?embed",
    bg: "linear-gradient(135deg,#161616,#2a2a2a)",
  },
  {
    title: "İlerleme",
    desc: "Grafikler, seriler ve geri bildirim tek ekranda.",
    cta: { text: "Giriş Yap", href: "/login" },
    bg: "url('/images/panel-progress.jpg')",
  },
];

export default function HoverOverlayTriptych() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="relative mx-auto max-w-7xl px-4">
      <div
        className="relative flex gap-4 h-[420px] md:h-[520px]"
        onMouseLeave={() => setActive(null)}
      >
        {PANELS.map((p, i) => {
          const isActive = active === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setActive(i)}          // masaüstü
              onClick={() => setActive(isActive ? null : i)} // mobil/dokunmatik
              className={[
                "relative overflow-hidden rounded-2xl transition-all duration-500 ease-out",
                "shadow-lg will-change-transform",
                isActive
                  ? "absolute inset-0 z-20"
                  : "flex-1 z-0 hover:scale-[1.02]",
                active !== null && !isActive ? "opacity-30 blur-[1px]" : "opacity-100",
              ].join(" ")}
              style={{
                background: p.bg ?? "linear-gradient(135deg,#0f172a,#1e293b)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: "pointer",
              }}
            >
              {/* Koyu/okunabilirlik için örtü */}
              <div className="absolute inset-0 bg-black/40"></div>

              {/* İçerik */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8">
                <header>
                  <h3 className="text-white text-2xl md:text-3xl font-semibold">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-white/80 max-w-md">{p.desc}</p>
                </header>

                {/* Canva varsa, 16:9 oranında kutu */}
                {p.canvaSrc ? (
                  <div className="relative mt-4 w-full pb-[56.25%] rounded-xl overflow-hidden shadow-2xl">
                    <iframe
                      title={p.title}
                      src={p.canvaSrc}
                      className="absolute inset-0 w-full h-full border-0"
                      loading="lazy"
                      allow="fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : null}

                {/* Çalışan CTA butonu */}
                <div className="mt-4">
                  <Link
                    href={p.cta.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-4 py-2 text-sm md:text-base font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
                    onClick={(e) => e.stopPropagation()} // kart tıklamasını engelle
                    aria-label={`${p.title} - ${p.cta.text}`}
                  >
                    {p.cta.text}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* İpucu: mobilde “geri” için alan */}
      <div className="mt-3 text-center text-sm text-neutral-500 md:hidden">
        Bir karta dokunarak aç/kapat.
      </div>
    </section>
  );
}
