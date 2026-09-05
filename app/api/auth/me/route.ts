import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '../../../../lib/session';

// GET /api/auth/me — sesi dari cookie HttpOnly (untuk guard & UI)
export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
