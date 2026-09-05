import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hrefForRole, SESSION_COOKIE, sessionCookieOptions, signSession } from '../../../../lib/session';

const ROLES = ['admin', 'guru', 'student', 'secretary'] as const;
const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  guru: 'Guru',
  student: 'Siswa',
  secretary: 'Sekretaris',
};

// POST /api/auth/login — { identifier, password, role }
// Kredensial dicek ke tabel User (bcrypt), peran harus cocok pilihan user.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? '').trim();
  const password = String(body?.password ?? '');
  const role = String(body?.role ?? '').trim();

  if (!identifier || !password) {
    return NextResponse.json(
      { error: 'Username dan password wajib diisi.' },
      { status: 400 },
    );
  }
  if (!role) {
    return NextResponse.json(
      { error: 'Silakan pilih peran login terlebih dahulu.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { username: identifier } });
  if (!user) {
    return NextResponse.json(
      { error: 'Username tidak terdaftar. Periksa kembali username Anda.' },
      { status: 401 },
    );
  }
  if (user.role !== role) {
    return NextResponse.json(
      {
        error: `Username tersebut terdaftar sebagai ${ROLE_LABEL[user.role] ?? 'yang sesuai'}. Pilih peran ${ROLE_LABEL[user.role] ?? 'yang sesuai'} untuk melanjutkan.`,
      },
      { status: 403 },
    );
  }
  const cocok = await bcrypt.compare(password, user.passwordHash);
  if (!cocok) {
    return NextResponse.json(
      { error: 'Password salah. Silakan periksa kembali password Anda.' },
      { status: 401 },
    );
  }

  const token = await signSession({
    sub: user.id,
    username: user.username,
    role: user.role as (typeof ROLES)[number],
    displayName: user.displayName,
    secretaryId: user.secretaryId,
  });

  const res = NextResponse.json({
    ok: true,
    href: hrefForRole(user.role as (typeof ROLES)[number]),
    user: {
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      secretaryId: user.secretaryId,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
