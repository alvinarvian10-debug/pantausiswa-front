import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/izin — daftar semua pengajuan (untuk guru / verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.leaveRequest.findMany({
      orderBy: { diajukanPada: 'desc' },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/izin failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/izin — simpan pengajuan izin/sakit/dispensasi siswa ke MySQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const alasan = String(body.alasan ?? '').trim();
    const tanggalMulai = String(body.tanggalMulai ?? '').trim();
    const tanggalSelesai = String(body.tanggalSelesai ?? tanggalMulai).trim();
    const jenis = String(body.jenis ?? 'Izin').trim();

    if (!alasan || !tanggalMulai) {
      return NextResponse.json(
        { error: 'Alasan dan tanggal mulai wajib diisi.' },
        { status: 400 },
      );
    }

    const row = await prisma.leaveRequest.create({
      data: {
        siswaId: body.siswaId ? String(body.siswaId) : null,
        kelasId: body.kelasId ? String(body.kelasId) : null,
        jenis,
        tanggalMulai,
        tanggalSelesai,
        alasan,
        lampiranNama: body.lampiranNama ? String(body.lampiranNama) : null,
        status: 'Menunggu',
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/izin failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
