// app/api/coaches/route.ts
import { NextRequest, NextResponse } from 'next/server';

function baseUrl() {
  const raw =
    process.env.PERSE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL || // fallback
    '';
  if (!raw) throw new Error('PERSE_BACKEND_URL env değişkeni eksik.');
  return raw.replace(/\/+$/, '');
}

function configuredPaths(): string[] {
  const fromEnv = (process.env.PERSE_COACHES_PATHS || '').trim();
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(p => (p.startsWith('/') ? p : `/${p}`));
  }
  // Varsayılan denemeler
  return ['/coaches', '/api/coaches', '/v1/coaches', '/api/v1/coaches'];
}

function isJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function tryFetch(path: string, qs: string, signal: AbortSignal) {
  const url = `${baseUrl()}${path}${qs}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok || !isJson(res)) {
    const t = await res.text().catch(() => '');
    throw new Error(
      `GET ${url} -> HTTP ${res.status} ${res.statusText}${t ? ` - ${t.slice(0, 120)}` : ''}`
    );
  }
  const json = await res.json();
  // Düz dizi veya {data: []} normalize et
  const arr = Array.isArray(json) ? json : Array.isArray((json as any)?.data) ? (json as any).data : [];
  return { arr, url };
}

let workingPath: string | null = null;

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const paths = configuredPaths();
  const controller = new AbortController();

  // daha önce çalışan yol varsa önce onu dene
  if (workingPath) {
    try {
      const { arr } = await tryFetch(workingPath, search, controller.signal);
      return NextResponse.json(arr, { status: 200 });
    } catch {
      workingPath = null; // tekrar keşfet
    }
  }

  // yolları sırayla dene
  const errors: string[] = [];
  for (const p of paths) {
    try {
      const { arr } = await tryFetch(p, search, controller.signal);
      workingPath = p;
      return NextResponse.json(arr, { status: 200 });
    } catch (e: any) {
      errors.push(String(e?.message || e));
    }
  }

  return NextResponse.json(
    {
      message:
        `Backend'de çalışan bir /coaches endpointi bulunamadı.\n` +
        `Base: ${baseUrl()}\n` +
        `Denediğim yollar:\n- ${paths.join('\n- ')}\n\n` +
        `Hatalar:\n- ${errors.join('\n- ')}\n\n` +
        `Çözüm: PERSE_COACHES_PATHS env değişkenini, doğru yolu içerecek şekilde ayarlayın (ör. "/coaches" veya "/api/coaches").`,
    },
    { status: 502 }
  );
}
