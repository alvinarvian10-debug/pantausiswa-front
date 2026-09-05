import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/kelas — daftar kelas
export async function GET() {
  try {
    const rows = await prisma.schoolClass.findMany({ orderBy: { nama: 'asc' } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/kelas failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/kelas — tambah kelas ({ nama, waliKelasId? })
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nama = String(body.nama ?? '').trim();
    if (!nama) {
      return NextResponse.json({ error: 'Nama kelas wajib diisi.' }, { status: 400 });
    }
    const row = await prisma.schoolClass.create({
      data: { nama, waliKelasId: body.waliKelasId ? String(body.waliKelasId) : null },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Nama kelas sudah terdaftar.' }, { status: 409 });
    }
    console.error('POST /api/kelas failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
