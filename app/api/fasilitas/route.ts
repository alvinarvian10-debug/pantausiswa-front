import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const KATEGORI = ['Ruangan', 'Elektronik', 'Olahraga'] as const;

// GET /api/fasilitas — daftar inventaris (untuk verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.facility.findMany({ orderBy: { nama: 'asc' } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/fasilitas failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/fasilitas — admin menambah fasilitas baru ke MySQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nama = String(body.nama ?? '').trim();
    const jumlahTotal = Number(body.jumlahTotal ?? 1);
    if (!nama) {
      return NextResponse.json({ error: 'Nama fasilitas wajib diisi.' }, { status: 400 });
    }
    if (!Number.isInteger(jumlahTotal) || jumlahTotal < 1) {
      return NextResponse.json({ error: 'Jumlah unit minimal 1.' }, { status: 400 });
    }
    const kategori = String(body.kategori ?? 'Elektronik');
    if (!KATEGORI.includes(kategori as (typeof KATEGORI)[number])) {
      return NextResponse.json({ error: 'Kategori harus Ruangan/Elektronik/Olahraga.' }, { status: 400 });
    }

    const row = await prisma.facility.create({
      data: {
        nama,
        kategori,
        icon: body.icon ? String(body.icon) : 'inventory_2',
        jumlahTotal,
        jumlahTersedia: jumlahTotal,
        kondisi: 'Baik',
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/fasilitas failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
