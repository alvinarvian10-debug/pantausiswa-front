import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/presensi — daftar semua catatan presensi (untuk verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.attendance.findMany({
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/presensi failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/presensi — catat/update presensi (check-in siswa & sekretaris).
// Upsert per (siswaId, tanggal): check-in ganda di hari yang sama tidak jadi duplikat.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const siswaId = String(body.siswaId ?? '').trim();
    if (!siswaId) {
      return NextResponse.json({ error: 'siswaId wajib diisi.' }, { status: 400 });
    }
    const tanggal = String(
      body.tanggal ?? new Date().toISOString().slice(0, 10),
    ).trim();
    const status = String(body.status ?? 'Hadir').trim();
    if (!['Hadir', 'Sakit', 'Izin', 'Alpa'].includes(status)) {
      return NextResponse.json(
        { error: 'Status harus Hadir/Sakit/Izin/Alpa.' },
        { status: 400 },
      );
    }

    const row = await prisma.attendance.upsert({
      where: { siswaId_tanggal: { siswaId, tanggal } },
      update: {
        status,
        waktu: body.waktu ? String(body.waktu) : undefined,
        keterangan: body.keterangan != null ? String(body.keterangan) : undefined,
      },
      create: {
        siswaId,
        tanggal,
        waktu: body.waktu ? String(body.waktu) : '-',
        status,
        keterangan: body.keterangan != null ? String(body.keterangan) : null,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/presensi failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
