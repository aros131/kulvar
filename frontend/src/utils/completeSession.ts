// utils/completeSession.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/,"");

function token() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t ? t.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "") : null;
}

export type CompleteSessionResponse = {
  message: string;
  progress: {
    progressPercentage?: number;
    completedSessions?: Array<{ sessionId: string }>;
    // ...extend with whatever your Progress schema returns
  };
};

export async function completeSession(
  programId: string,
  sessionId?: string,
  sessionName?: string
): Promise<CompleteSessionResponse> {
  const t = token();
  if (!t) throw new Error("Giriş yapın: token yok");
  if (!programId || (!sessionId && !sessionName)) {
    throw new Error("programId ve (sessionId | sessionName) gerekli");
  }

  const res = await fetch(`${API}/progress/complete-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${t}`,
    },
    cache: "no-store",
    credentials: "include",
    body: JSON.stringify({ programId, sessionId, sessionName }),
  });

  // Nice error body for debugging
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Tamamlama hatası ${res.status}: ${bodyText}`);
  }

  // Some hosts return HTML on error; guard parse
  if (!ct.includes("application/json")) {
    return { message: "OK", progress: {} } as CompleteSessionResponse;
  }
  return JSON.parse(bodyText) as CompleteSessionResponse;
}
