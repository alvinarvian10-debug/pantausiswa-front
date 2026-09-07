import { NextResponse, type NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:4000/api';
const SESSION_COOKIE = 'pantausiswa.session';

/**
 * Proxy same-origin ke backend NestJS: /api/be/<path> -> <BACKEND>/<path>.
 * Token diambil dari cookie HttpOnly (dibaca server-side, tak terlihat JS)
 * lalu diteruskan sebagai header Bearer. Frontend tidak lagi memegang token.
 */
async function proxy(req: NextRequest, params: { path: string[] }) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const target = `${BACKEND}/${params.path.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    if (text) init.body = text;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { message: 'Backend tidak terjangkau', code: 'BACKEND_UNREACHABLE' },
      { status: 502 },
    );
  }

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}
