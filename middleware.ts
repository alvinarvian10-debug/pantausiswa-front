import { NextResponse, type NextRequest } from 'next/server';
import * as jose from 'jose';

const SESSION_COOKIE = 'pantausiswa.session';

// Penjaga server-side untuk /dashboard/*.
// Token berasal dari backend NestJS (sysch/back, JWT_SECRET yang sama).
// Mendukung payload { role: ADMIN|GURU|SISWA|SEKRETARIS } dan legacy { role: admin|guru|student|secretary }.
function normalizeRole(raw: unknown): string {
  const r = String(raw ?? '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'guru') return 'guru';
  if (r === 'secretary' || r === 'sekretaris') return 'secretary';
  return 'student';
}
function roleForPath(pathname: string): string {
  if (pathname.includes('/guru')) return 'guru';
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/secretary')) return 'secretary';
  return 'student';
}

export async function middleware(req: NextRequest) {
  const loginUrl = new URL('/login', req.url);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(loginUrl);
  }
  try {
    // Samakan dengan back/.env -> JWT_SECRET.
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET belum diisi di front/.env');
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
    const role = normalizeRole(payload.role);
    if (role !== roleForPath(req.nextUrl.pathname)) {
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
