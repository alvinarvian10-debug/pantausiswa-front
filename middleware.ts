import { NextResponse, type NextRequest } from 'next/server';
import * as jose from 'jose';

const SESSION_COOKIE = 'pantausiswa.session';

// Penjaga server-side: tanpa cookie sesi valid, /dashboard/* tak terkirim.
// (localStorage hanya untuk UX client; cookie HttpOnly yang menegakkan.)
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
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET belum diisi');
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
    const role = String(payload.role ?? '');
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
