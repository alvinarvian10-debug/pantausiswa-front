import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { SESSION_COOKIE, verifySession } from '../../../../lib/session';

// POST /api/auth/admin-set-password — admin mengganti password user lain.
// Dipakai saat admin menyetujui permintaan ganti password sekretaris.
// body: { username, newPassword }
export async function POST(req: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengganti password.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? '').trim();
  const newPassword = String(body?.newPassword ?? '');
  if (!username || newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Username dan password baru (min. 6 karakter) wajib diisi.' },
      { status: 400 },
    );
  }

  try {
    await prisma.user.update({
      where: { username },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Username tidak ditemukan di database.' }, { status: 404 });
    }
    console.error('POST /api/auth/admin-set-password failed:', e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}
