// NO /api suffix here — just your origin
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export function makeUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}/${pathOrUrl.replace(/^\/+/, "")}`;
}

export async function fetchJSON<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  const url = makeUrl(pathOrUrl);
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${url} – ${body.slice(0, 200)}…`);
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(`Non-JSON at ${url}: ${body.slice(0, 200)}…`);
  }
  return res.json() as Promise<T>;
}

// Returns null on 404, throws on other problems
export async function fetchJSONorNull<T>(pathOrUrl: string, init?: RequestInit): Promise<T | null> {
  const url = makeUrl(pathOrUrl);
  const res = await fetch(url, init);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${url} – ${body.slice(0, 200)}…`);
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(`Non-JSON at ${url}: ${body.slice(0, 200)}…`);
  }
  return res.json() as Promise<T>;
}
