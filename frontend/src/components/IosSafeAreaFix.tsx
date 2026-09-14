"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// WKWebView bug: on a cold app launch, env(safe-area-inset-top) is sometimes
// resolved to 0 on the very first paint and only recalculated once a scroll
// or resize event fires — the page renders as if the notch/status-bar area
// weren't reserved, then a real scroll snaps it into place, leaving a ~1cm
// gap that only becomes visible (or disappears) after the user drags the
// page. A synthetic 1px scroll right after mount forces WebKit to redo the
// safe-area layout pass without the user having to do it manually.
export default function IosSafeAreaFix() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const nudge = () => {
      window.scrollTo(0, 1);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };
    // Right after mount, and again once more on the next frame in case the
    // first nudge fired before the WebView finished its own layout pass.
    nudge();
    const raf = requestAnimationFrame(nudge);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
