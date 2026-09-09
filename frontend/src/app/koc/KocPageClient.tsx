"use client";

import { useEffect, useState } from "react";
import PublicNavbar from "@/components/nav/PublicNavbar";
import UserPageShell from "@/components/user/UserPageShell";
import CoachPageShell from "@/components/coach/CoachPageShell";
import CoachesPageBody from "@/components/CoachesPageBody";

type Session = { role: "user" | "coach" } | null;

// /koc is public, but it should still feel like the rest of the site: the
// marketing navbar for a signed-out visitor, and the same dashboard chrome
// (sidebar + mobile bottom nav) a signed-in coach or client sees everywhere else.
export default function KocPageClient() {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (token && (role === "user" || role === "coach")) {
        setSession({ role });
      }
    } catch {
      // localStorage unavailable — treat as signed out
    }
    setReady(true);
  }, []);

  // Avoid a flash of the wrong navbar while we check localStorage.
  if (!ready) return <div className="min-h-screen bg-background" />;

  if (session?.role === "user") {
    return (
      <UserPageShell>
        <CoachesPageBody />
      </UserPageShell>
    );
  }

  if (session?.role === "coach") {
    return (
      <CoachPageShell>
        <CoachesPageBody />
      </CoachPageShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <CoachesPageBody />
    </div>
  );
}
