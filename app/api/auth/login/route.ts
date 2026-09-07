import { NextResponse, type NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:4000/api';
const SESSION_COOKIE = 'pantausiswa.session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

// Secure hanya bila request masuk via HTTPS (otomatis benar di localhost
// HTTP maupun production HTTPS). Override paksa via COOKIE_SECURE=true/false.
function cookieSecure(req: NextRequest): boolean {
  const flag = process.env.COOKIE_SECURE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  const proto = req.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return req.nextUrl.protocol === 'https:';
}

function cookieOptions(req: NextRequest) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
    secure: cookieSecure(req),
  };
}

// POST /api/auth/login { email, password } -> backend, token disimpan
// sebagai cookie HttpOnly (JS tidak bisa baca) + kembalikan user.
export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Body tidak valid' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: 'Backend tidak terjangkau. Pastikan service back jalan.' },
      { status: 502 },
    );
  }

  const data = (await upstream.json().catch(() => null)) as {
    accessToken?: string;
    user?: unknown;
    message?: string;
  } | null;

  if (!upstream.ok || !data?.accessToken || !data?.user) {
    return NextResponse.json(
      { message: data?.message ?? 'Email atau password salah.' },
      { status: upstream.status },
    );
  }

  const res = NextResponse.json({ user: data.user });
  res.cookies.set(SESSION_COOKIE, data.accessToken, cookieOptions(req));
  return res;
}
