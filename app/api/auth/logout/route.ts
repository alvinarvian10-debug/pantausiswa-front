import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'pantausiswa.session';

// POST /api/auth/logout — hapus cookie sesi HttpOnly.
export async function POST(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto');
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' &&
      (proto
        ? proto.split(',')[0].trim() === 'https'
        : req.nextUrl.protocol === 'https:'));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    secure,
  });
  return res;
}
