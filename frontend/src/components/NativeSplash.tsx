"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

// iOS's own launch screen (LaunchScreen.storyboard) is a single static frame —
// the OS won't animate it. Apps like X fake an "animated splash" by dismissing
// that static screen instantly and handing off to a brief in-app overlay with
// its own animation. This is that hand-off: same mark, same layout, but the
// logo pulses like a heartbeat while the real app finishes its first paint,
// then fades out on its own.
export default function NativeSplash() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    setMounted(true);
    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => setHidden(true), 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!mounted || hidden) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <svg
        width="128"
        height="128"
        viewBox="0 0 32 32"
        className="animate-splash-heartbeat"
      >
        <rect width="32" height="32" rx="8" fill="#2D2880" />
        <text
          x="15"
          y="23"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="19"
          fill="#ffffff"
          textAnchor="middle"
        >
          P
        </text>
        <circle cx="24.5" cy="24.5" r="2.6" fill="#D4603A" />
      </svg>
    </div>
  );
}
