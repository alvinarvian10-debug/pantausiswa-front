import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Seeding akun awal — HANYA untuk setup pertama.
// Cara pakai: POST /api/auth/seed dengan body { "key": "<isi SETUP_KEY di .env>" }.
// Setelah berhasil: hapus folder app/api/auth/seed lalu commit.
export async function POST(req: Request) {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey) {
    return NextResponse.json(
      { error: 'SETUP_KEY belum diisi di .env. Lihat PANDUAN-SETUP.md.' },
      { status: 500 },
    );
  }
  const body = await req.json().catch(() => null);
  if (body?.key !== setupKey) {
    return NextResponse.json({ error: 'Kunci salah.' }, { status: 403 });
  }

  const accounts = [
    { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Admin Sekolah', secretaryId: null },
    { username: 'guru', password: 'guru123', role: 'guru', displayName: 'Guru', secretaryId: null },
    { username: 'siswa', password: 'siswa123', role: 'student', displayName: 'Siswa', secretaryId: null },
    { username: 'sekretaris.xipa1', password: 'sekretaris123', role: 'secretary', displayName: 'Sekretaris X IPA 1', secretaryId: 'SK-01' },
    { username: 'sekretaris.xipa2', password: 'sekretaris123', role: 'secretary', displayName: 'Sekretaris X IPA 2', secretaryId: 'SK-02' },
  ];

  const result = [];
  for (const a of accounts) {
    const row = await prisma.user.upsert({
      where: { username: a.username },
      update: {},
      create: {
        username: a.username,
        passwordHash: await bcrypt.hash(a.password, 10),
        role: a.role,
        displayName: a.displayName,
        secretaryId: a.secretaryId,
      },
    });
    result.push({ username: row.username, role: row.role });
  }
  return NextResponse.json({ seeded: result }, { status: 201 });
}
