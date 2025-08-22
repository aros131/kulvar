"use client";

import { useEffect, useMemo, useState } from "react";
import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type DebugInfo = {
  ssrHasToken: boolean;
  ssrTokenLen: number;
};

type Props = {
  coach: Coach & { id: string; isFollowing?: boolean };
  programs: Program[];
  reviews: Review[];
  debug?: DebugInfo;
};

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
};

export default function ClientBridge({ coach, programs, reviews, debug }: Props) {
  const API = apiBase();

  // 👀 CLIENT: read token from localStorage
  const [csrToken, setCsrToken] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(!!coach.isFollowing);
  const [followCheck, setFollowCheck] = useState<null | { ok: boolean; status?: number; body?: any }>(null);

  useEffect(() => {
    const t = cleanToken();
    setCsrToken(t);
  }, []);

  // If SSR didn’t include follow state, fetch client-side with local token
  useEffect(() => {
    let mounted = true;
    if (typeof coach.isFollowing === "boolean") return;
    const token = cleanToken();
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API}/coaches/${coach.id}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const ok = r.ok;
        let body: any = null;
        try { body = await r.json(); } catch {}
        if (!mounted) return;
        setFollowCheck({ ok, status: r.status, body });
        if (ok && typeof body?.isFollowing === "boolean") setIsFollowing(body.isFollowing);
      } catch (e) {
        if (!mounted) return;
        setFollowCheck({ ok: false });
      }
    })();

    return () => { mounted = false; };
  }, [API, coach.id, coach.isFollowing]);

  const handleFollowToggle = async (next: boolean) => {
    const token = cleanToken();
    if (!token) {
      alert("Not logged in: no token in localStorage. (We also need a token cookie for SSR.)");
      window.location.href = "/login";
      return;
    }
    const prev = isFollowing;
    setIsFollowing(next); // optimistic
    const method = next ? "PUT" : "DELETE";
    const res = await fetch(`${API}/coaches/${coach.id}/follow`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setIsFollowing(prev);
      const txt = await res.text().catch(() => "");
      throw new Error(`Follow failed: ${res.status} ${txt}`);
    }
  };

  const debugBox = useMemo(() => {
    const mask = (s: string | null | undefined) => (s ? `${s.slice(0, 8)}…${s.slice(-4)}` : "");
    return (
      <div className="mb-4 rounded-md border p-3 text-xs text-muted-foreground">
        <div><b>SSR cookie token present:</b> {debug?.ssrHasToken ? "YES" : "NO"} {debug?.ssrTokenLen ? `(len=${debug?.ssrTokenLen})` : ""}</div>
        <div><b>CSR localStorage token present:</b> {csrToken ? `YES (len=${csrToken.length}, ${mask(csrToken)})` : "NO"}</div>
        <div><b>Coach.isFollowing (from SSR):</b> {typeof coach.isFollowing === "boolean" ? String(coach.isFollowing) : "undefined"}</div>
        <div><b>Client follow check:</b> {followCheck ? `ok=${followCheck.ok} status=${followCheck.status ?? "-"}` : "pending/skip"}</div>
        {followCheck?.body ? <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(followCheck.body, null, 2)}</pre> : null}
      </div>
    );
  }, [debug, csrToken, followCheck, coach.isFollowing]);

  return (
    <div>
      {/* remove this box later; it’s here just to verify token presence */}
      {debugBox}

      <CoachProfileClient
        coach={coach}
        programs={programs}
        reviews={reviews}
        locale="tr"
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onMessage={(id) => { window.location.href = `/messages?to=${id}`; }}
      />
    </div>
  );
}
