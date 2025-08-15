// utils/completeSession.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

function token() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t ? t.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "") : null;
}

export async function completeSession(programId: string, sessionId?: string, sessionName?: string) {
  const t = token();
  if (!t) throw new Error("Giriş yapın: token yok");

  const res = await fetch(`${API}/progress/complete-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${t}`,
    },
    body: JSON.stringify({ programId, sessionId, sessionName }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Tamamlama hatası ${res.status}: ${txt}`);
  }
  return res.json();
}
