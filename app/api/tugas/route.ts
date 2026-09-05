import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/tugas — daftar semua tugas (untuk verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.assignment.findMany({
      orderBy: { dibuatPada: 'desc' },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/tugas failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/tugas — guru membuat tugas baru ke MySQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const judul = String(body.judul ?? '').trim();
    const deskripsi = String(body.deskripsi ?? '').trim();
    if (!judul || !deskripsi) {
      return NextResponse.json(
        { error: 'Judul dan deskripsi wajib diisi.' },
        { status: 400 },
      );
    }

    const row = await prisma.assignment.create({
      data: {
        guruId: body.guruId ? String(body.guruId) : null,
        kelasId: body.kelasId ? String(body.kelasId) : null,
        mapel: body.mapel ? String(body.mapel) : 'Umum',
        judul,
        deskripsi,
        lampiranNama: body.lampiranNama ? String(body.lampiranNama) : null,
        lampiranLink: body.lampiranLink ? String(body.lampiranLink) : null,
        deadline: body.deadline ? String(body.deadline) : new Date().toISOString().slice(0, 10),
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/tugas failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
