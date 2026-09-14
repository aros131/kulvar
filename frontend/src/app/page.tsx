"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import dynamicImport from "next/dynamic";

// ssr:false keeps the marketing markup out of the server-rendered HTML entirely —
// otherwise it would always flash on screen first (native shell and returning
// logged-in web visitors included) before the redirect below has a chance to run.
const LandingPage = dynamicImport(() => import("@/components/marketing/LandingPage"), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "show" | "redirecting">("checking");

  // useLayoutEffect (not useEffect) so this resolves before the browser paints —
  // native app shell (Capacitor) has no reason to show marketing content, the
  // visitor already installed the app. Web keeps the landing page for organic
  // traffic, but skips straight past it for a returning, logged-in visitor.
  useLayoutEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const token = localStorage.getItem("token");
    if (!isNative && !token) {
      setStatus("show");
      return;
    }

    setStatus("redirecting");
    const role = localStorage.getItem("role");
    if (!token) router.replace("/login");
    else if (role === "coach") router.replace("/dashboard/coach");
    else if (role === "admin") router.replace("/admin-dashboard");
    else if (role === "user") router.replace("/dashboard/user");
    else router.replace("/login");
  }, [router]);

  if (status !== "show") return null;
  return <LandingPage />;
}
