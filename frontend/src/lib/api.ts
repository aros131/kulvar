// Single source of truth for your backend origin (NO /api prefix needed)
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://kulvar-qb7t.onrender.com"
).replace(/\/+$/, "");

function makeUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.replace(/^\/+/, "");
  return `${API_BASE}/${path}`;
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

// Try a list of candidate paths; return the first that succeeds with JSON; 404s are skipped.
export async function tryCandidatesJSON<T>(
  candidates: string[],
  init?: RequestInit
): Promise<{ data: T | null; path: string | null }> {
  for (const candidate of candidates) {
    const url = makeUrl(candidate);
    try {
      const res = await fetch(url, init);
      if (res.status === 404) continue; // try next
      if (!res.ok) {
        // For non-404 errors, throw; the caller will decide
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${url} – ${body.slice(0, 200)}…`);
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        // Not JSON? Try next candidate
        continue;
      }
      const data = (await res.json()) as T;
      return { data, path: candidate };
    } catch (e) {
      // Network / CORS / 5xx → rethrow to surface the real problem
      throw e;
    }
  }
  return { data: null, path: null };
}
