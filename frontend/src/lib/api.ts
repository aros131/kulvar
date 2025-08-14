// One source of truth for the backend URL.
// Supports either env name and has a safe default.
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://kulvar-qb7t.onrender.com"
).replace(/\/+$/, "");

function makeUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}/${pathOrUrl.replace(/^\/+/, "")}`;
}

// Fetch helper that guarantees JSON or throws a readable error.
export async function fetchJSON<T>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const url = makeUrl(pathOrUrl);
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${url} – ${body.slice(0, 200)}…`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(`Non-JSON response at ${url}: ${body.slice(0, 200)}…`);
  }
  return res.json() as Promise<T>;
}
