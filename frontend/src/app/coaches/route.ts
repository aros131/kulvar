// app/coaches/route.ts
import { NextRequest, NextResponse } from 'next/server';

function trimEndSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);

  const base = process.env.KULVAR_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  const path = process.env.KULVAR_COACHES_PATH || '/coaches';

  if (!base) {
    return NextResponse.json(
      { message: 'Server env KULVAR_BACKEND_URL veya NEXT_PUBLIC_API_URL eksik.' },
      { status: 500 }
    );
  }

  const url = `${trimEndSlash(base)}${path}${search}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const ct = res.headers.get('content-type') || '';

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json(
        { message: `Upstream ${url} -> HTTP ${res.status} ${res.statusText}`, sample: t.slice(0, 200) },
        { status: 502 }
      );
    }

    if (!ct.includes('application/json')) {
      const t = await res.text().catch(() => '');
      return NextResponse.json(
        { message: `Upstream ${url} JSON dönmedi (content-type=${ct})`, sample: t.slice(0, 200) },
        { status: 502 }
      );
    }

    const json = await res.json();
    // Düz dizi veya {data: []} normalize et
    const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : json;
    return NextResponse.json(arr, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: `Upstream fetch hata: ${e?.message || String(e)}` },
      { status: 502 }
    );
  }
}
