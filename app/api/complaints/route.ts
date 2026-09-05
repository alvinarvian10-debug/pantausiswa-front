import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/complaints — daftar semua komplain (untuk admin / verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/complaints failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/complaints — simpan aduan baru dari form siswa ke MySQL XAMPP
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const judul = String(body.judul ?? body.title ?? '').trim();
    const deskripsi = String(body.deskripsi ?? body.description ?? '').trim();
    const jenis = String(body.jenis ?? body.category ?? 'Fasilitas').trim();

    if (!judul || !deskripsi) {
      return NextResponse.json(
        { error: 'Judul dan deskripsi wajib diisi.' },
        { status: 400 },
      );
    }

    const row = await prisma.complaint.create({
      data: {
        title: judul,
        category: jenis,
        description: deskripsi,
        isAnonymous: Boolean(body.isAnonim ?? body.isAnonymous ?? false),
        status: 'Baru',
        siswaId: body.siswaId ? String(body.siswaId) : null,
        fasilitasId: body.fasilitasId ? String(body.fasilitasId) : null,
        lampiranNama: body.lampiranNama ? String(body.lampiranNama) : null,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/complaints failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan dan `npx prisma db push` sudah dijalankan.' },
      { status: 500 },
    );
  }
}
