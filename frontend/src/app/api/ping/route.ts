// src/app/api/ping/route.ts
export const runtime = "nodejs"; // ensure Node runtime

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: "/api/ping" }), {
    headers: { "content-type": "application/json" },
  });
}

