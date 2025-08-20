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
      {/* Mobile: yatay kaydırmalı sıra (snap) — Desktop: klasik 3lü büyüme */}
      <div
        className={[
          // row everywhere
          "relative flex gap-3 md:gap-4",
          // heights
          "h-[320px] sm:h-[360px] md:h-[520px]",
          // mobile horizontal scroll + snap
          "overflow-x-auto md:overflow-visible snap-x snap-mandatory",
          // hide scrollbars (supported)
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        ].join(" ")}
        onMouseLeave={() => setActive(null)}
      >
        {PANELS.map((p, i) => {
          const isActive = active === i;

          return (
            <div
              key={i}
              role="button"
              aria-pressed={isActive}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}                 // desktop hover
              onClick={() => setActive(isActive ? null : i)}     // mobile tap
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive(isActive ? null : i)}
              className={[
                "relative h-full overflow-hidden rounded-2xl shadow-lg cursor-pointer select-none",
                "transform-gpu will-change-[transform,opacity,filter]",
                "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                // 🟢 Mobile widths (side-by-side): grow a bit when active
                isActive ? "w-[88vw] sm:w-[84vw]" : "w-[85vw] sm:w-[80vw]",
                "flex-none snap-center",
                // 🟢 Desktop layout: flex grow logic (no overlay)
                "md:w-auto md:flex-1 md:basis-0",
                // depth + dimming
                isActive ? "scale-[1.02] md:z-10" : "hover:scale-[1.01]",
                active !== null && !isActive ? "opacity-70" : "opacity-100",
              ].join(" ")}
              // desktop growth via flexGrow (mobile uses width above)
              style={{ flexGrow: isActive ? 2 : 1 }}
            >
              {/* BG images — cross-fade */}
              <div className="absolute inset-0">
                <Image
                  src={p.img}
                  alt={p.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 90vw"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-4 md:p-8 text-white">
                {!!p.desc && (
                  <p className="text-xs sm:text-sm opacity-80 max-w-[32ch] md:max-w-none leading-relaxed [text-wrap:balance]">
                    {p.desc}
                  </p>
                )}
                <h3 className="mt-1 md:mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow leading-tight [text-wrap:balance] break-words">
                  {p.title.toUpperCase()}
                </h3>
                <div className="mt-3 md:mt-5">
                  <Link
                    href={p.cta.href}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-full bg-white text-gray-900 px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
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

      {/* Mobile hint */}
      <div className="mt-3 text-center text-xs md:text-sm text-neutral-500 md:hidden">
        Kaydır ya da dokunarak kartı odakla.
      </div>
    </section>
  );
}
