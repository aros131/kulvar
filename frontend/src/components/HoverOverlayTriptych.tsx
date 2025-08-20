// components/HoverOverlayTriptych.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Panel = {
  title: string;
  desc: string;
  cta: { text: string; href: string };
  canvaSrc?: string; // "https://www.canva.com/design/XXXX/view?embed"
  bg?: string;       // "url('/images/...')" veya gradient
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

type Props = {
  height?: number;      // satır yüksekliği (px)
  className?: string;   // dışarıdan ek class
};

export default function HoverOverlayTriptych({ height = 560, className }: Props) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      className={`relative w-full ${className ?? ""}`}
      style={{ height }}
      onMouseLeave={() => setActive(null)}
    >
      {/* 3 kolon, boşluksuz, tam yükseklik */}
      <div className="grid grid-cols-3 gap-0 h-full">
        {PANELS.map((p, i) => {
          const isActive = active === i;
          return (
            <div
              key={i}
              role="button"
              aria-pressed={isActive}
              onMouseEnter={() => setActive(i)}                 // desktop hover
              onClick={() => setActive(isActive ? null : i)}    // mobile tap
              className={[
                // temel
                "h-full overflow-hidden cursor-pointer",
                // hover overlay: aktifse tüm satırı kapla
                isActive ? "absolute inset-0 z-20" : "relative z-0",
                // pürüzsüz animasyon
                "transform-gpu will-change-[transform,opacity,filter]",
                "transition-[transform,opacity,filter] duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]",
                // pasif kartlar soluk/küçük
                active !== null && !isActive ? "opacity-60" : "opacity-100",
                active !== null && !isActive ? "scale-[0.985]" : "scale-100",
              ].join(" ")}
              style={{
                background: p.bg ?? "linear-gradient(135deg,#0f172a,#1e293b)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Okunabilirlik için alt kısımda gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* İçerik (sol-alt) */}
              <div className="absolute left-6 right-6 bottom-6 z-10 text-white select-none">
                <p className="text-sm opacity-80">{p.desc}</p>
                <h3 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow">
                  {p.title.toUpperCase()}
                </h3>
                <div className="mt-5">
                  <Link
                    href={p.cta.href}
                    onClick={(e) => e.stopPropagation()} // kart tıklamasını engelle
                    className="inline-flex items-center justify-center rounded-full bg-white text-gray-900 px-5 py-2.5 text-sm font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
                    aria-label={`${p.title} - ${p.cta.text}`}
                  >
                    {p.cta.text}
                  </Link>
                </div>
              </div>

              {/* Canva embed istersen */}
              {p.canvaSrc && (
                <iframe
                  title={p.title}
                  src={p.canvaSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  allow="fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
