// components/HoverOverlayTriptych.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type Panel = {
  title: string;      // full title (shown on md+ and on active)
  short: string;      // short mobile label (shown on inactive mobile)
  desc: string;       // optional
  cta: { text: string; href: string };
  img: string;        // small state image
  imgHover: string;   // active/hover image
};

const PANELS: Panel[] = [
  {
    title: "Kendine Uygun Koçu Bul",
    short: "Koçlar",
    desc: "",
    cta: { text: "Koçları Gör", href: "/koc" },
    img: "/images/panel-program-sm.jpg",
    imgHover: "/images/panel-program-lg.jpg",
  },
  {
    title: "İlerlemeni Takip Et",
    short: "İlerleme",
    desc: "",
    cta: { text: "Hemen Başla", href: "/kayit" },
    img: "/images/panel-teaser-sm.jpg",
    imgHover: "/images/panel-teaser-lg.jpg",
  },
  {
    title: "Topluluğa Katıl",
    short: "Topluluk",
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
      {/* Always a single row — no swipe. Active grows, others shrink a bit. */}
      <div
        className="relative flex gap-3 md:gap-4 h-[260px] sm:h-[300px] md:h-[520px]"
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
              onMouseEnter={() => setActive(i)}                   // desktop hover
              onClick={() => setActive(isActive ? null : i)}       // mobile tap
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive(isActive ? null : i)}
              className={[
                "relative h-full overflow-hidden rounded-2xl shadow-lg cursor-pointer select-none",
                "transform-gpu will-change-[transform,opacity,filter]",
                "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                // row layout — no wrap, no scroll
                "basis-0 flex-1",
                // subtle depth
                isActive ? "scale-[1.02] z-10" : "hover:scale-[1.01]",
                active !== null && !isActive ? "opacity-75" : "opacity-100",
              ].join(" ")}
              style={{ flexGrow: isActive ? 2 : 1 }}               // grow the active card
            >
              {/* Background images — cross-fade */}
              <div className="absolute inset-0">
                <Image
                  src={p.img}
                  alt={p.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 34vw"
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
                {/* Description:
                   - Mobile: show only when active
                   - Desktop: always show if provided */}
                {p.desc ? (
                  <p
                    className={[
                      "opacity-80 leading-relaxed [text-wrap:balance]",
                      isActive ? "block" : "hidden",
                      "md:block",
                      "text-xs sm:text-sm md:text-sm",
                      "max-w-[30ch] md:max-w-none",
                    ].join(" ")}
                  >
                    {p.desc}
                  </p>
                ) : null}

                {/* Title:
                   - Mobile inactive: SHORT label
                   - Mobile active or any md+: FULL title */}
                <h3 className="mt-1 md:mt-2 font-extrabold tracking-tight drop-shadow leading-tight break-words">
                  {/* full title */}
                  <span
                    className={[
                      "hidden",            // default hidden
                      isActive ? "inline" : "hidden", // mobile active = show
                      "md:inline",         // md+ always show full
                      "text-2xl sm:text-3xl md:text-4xl",
                    ].join(" ")}
                  >
                    {p.title.toUpperCase()}
                  </span>
                  {/* spacer between variants */}
                  <span className="inline md:hidden">&nbsp;</span>
                  {/* short label (only mobile inactive) */}
                  <span
                    className={[
                      "inline md:hidden",  // only mobile
                      isActive ? "hidden" : "inline",
                      "text-xl sm:text-2xl",
                    ].join(" ")}
                  >
                    {p.short.toUpperCase()}
                  </span>
                </h3>

                {/* CTA:
                   - Mobile: show only when active
                   - Desktop: always show */}
                <div className={[(isActive ? "block" : "hidden"), "md:block mt-3 md:mt-5"].join(" ")}>
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

      {/* Mobile hint (optional) */}
      <div className="mt-3 text-center text-xs md:text-sm text-neutral-500 md:hidden">
        Kartı odaklamak için dokun.
      </div>
    </section>
  );
}
