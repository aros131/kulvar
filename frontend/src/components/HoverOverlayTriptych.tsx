// components/HoverOverlayTriptych.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type Panel = {
  title: string;
  desc: string;
  cta: { text: string; href: string };
  img: string;       // küçük durum görseli
  imgHover: string;  // hover/aktif durum görseli
};

const PANELS: Panel[] = [
  {
    title: "Kendine Uygun Koçu Bul",
    desc: "",
    cta: { text: "Koçları Gör", href: "/koc" },
    img: "/images/panel-program-sm.jpg",
    imgHover: "/images/panel-program-lg.jpg",
  },
  {
    title: "İlerlemeni Takip Et",
    desc: "",
    cta: { text: "Hemen Başla", href: "/kayit" },
    img: "/images/panel-teaser-sm.jpg",
    imgHover: "/images/panel-teaser-lg.jpg",
    // canvaSrc: "https://www.canva.com/design/XXXX/view?embed",
  },
  {
    title: "Topluluğa Katıl",
    desc: "",
    cta: { text: "Giriş Yap", href: "/login" },
    img: "/images/panel-progress-sm.jpg",
    imgHover: "/images/panel-progress-lg.jpg",
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
              role="button"
              aria-pressed={isActive}
              onMouseEnter={() => setActive(i)}              // desktop hover
              onClick={() => setActive(isActive ? null : i)} // mobile tap
              className={[
                "relative overflow-hidden rounded-2xl shadow-lg cursor-pointer",
                "will-change-transform transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isActive ? "absolute inset-0 z-20" : "flex-1 z-0 hover:scale-[1.02]",
                active !== null && !isActive ? "opacity-60" : "opacity-100",
              ].join(" ")}
            >
              {/* Görsel katmanları: küçük ve hover görseli cross-fade */}
              <div className="absolute inset-0">
                <Image
                  src={p.img}
                  alt={p.title}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  priority={i === 0}
                  className={[
                    "object-cover transition-opacity duration-500 ease-out",
                    isActive ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                />
                <Image
                  src={p.imgHover}
                  alt={`${p.title} (aktif)`}
                  fill
                  sizes="100vw"
                  loading="lazy"
                  className={[
                    "object-cover transition-opacity duration-500 ease-out",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
                {/* Alt kısım okunabilirlik gradyanı */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* İçerik */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
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
            </div>
          );
        })}
      </div>

      {/* Mobil ipucu */}
      <div className="mt-3 text-center text-sm text-neutral-500 md:hidden">
        Bir karta dokunarak aç/kapat.
      </div>
    </section>
  );
}
