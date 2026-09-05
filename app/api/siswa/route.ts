import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const TONES = ['emerald', 'blue', 'amber', 'red', 'slate'] as const;

// GET /api/siswa — daftar siswa
export async function GET() {
  try {
    const rows = await prisma.student.findMany({ orderBy: { nama: 'asc' } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/siswa failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/siswa — tambah siswa ({ nama, nis, kelasId?, tone? })
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nama = String(body.nama ?? '').trim();
    const nis = String(body.nis ?? '').trim();
    if (!nama || !nis) {
      return NextResponse.json({ error: 'Nama dan NIS wajib diisi.' }, { status: 400 });
    }
    const tone = String(body.tone ?? 'emerald');
    const row = await prisma.student.create({
      data: {
        nama,
        nis,
        kelasId: body.kelasId ? String(body.kelasId) : null,
        tone: TONES.includes(tone as (typeof TONES)[number]) ? tone : 'emerald',
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'NIS sudah terdaftar.' }, { status: 409 });
    }
    console.error('POST /api/siswa failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
