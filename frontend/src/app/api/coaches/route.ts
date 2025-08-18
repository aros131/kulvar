// app/api/coaches/route.ts
import { NextRequest, NextResponse } from 'next/server';

const CANDIDATE_PATHS = ['/coaches', '/api/coaches', '/v1/coaches', '/api/v1/coaches'];
let workingPath: string | null = null;

function isJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

function baseUrl() {
  const raw =
    process.env.KULVAR_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://kulvar-qb7t.onrender.com';
  return raw.replace(/\/+$/, '');
}

async function tryFetch(path: string, qs: string, signal: AbortSignal) {
  const url = `${baseUrl()}${path}${qs}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok || !isJson(res)) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${t ? ` - ${t.slice(0, 120)}` : ''}`);
  }
  const json = await res.json();
  return { json, url };
}

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const controller = new AbortController();

  // if we’ve already found a good path, reuse it
  if (workingPath) {
    try {
      const { json } = await tryFetch(workingPath, search, controller.signal);
      const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      return NextResponse.json(arr, { status: 200 });
    } catch (e) {
      // fall through and re-detect
      workingPath = null;
    }
  }

  // detect a working endpoint
  let lastErr = '';
  for (const p of CANDIDATE_PATHS) {
    try {
      const { json } = await tryFetch(p, search, controller.signal);
      workingPath = p;
      const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      return NextResponse.json(arr, { status: 200 });
    } catch (e: any) {
      lastErr = `${p}: ${e?.message || e}`;
    }
  }

  return NextResponse.json(
    {
      message:
        `No working /coaches endpoint found at ${baseUrl()}. Last error: ${lastErr}. ` +
        `Set KULVAR_BACKEND_URL to your backend base URL and ensure it exposes GET /coaches.`,
    },
    { status: 502 }
  );
}
