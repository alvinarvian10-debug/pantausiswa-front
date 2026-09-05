import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/izin/[id] — ambil satu pengajuan (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}

// PATCH /api/izin/[id] — setujui / tolak pengajuan (guru)
// body: { keputusan: 'Disetujui' | 'Ditolak', alasanTolak?: string }
// Saat disetujui, otomatis catat baris Attendance (cermin perilaku store.prosesIzin).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const keputusan = String(body.keputusan ?? body.status ?? '').trim();
    if (keputusan !== 'Disetujui' && keputusan !== 'Ditolak') {
      return NextResponse.json(
        { error: "Keputusan harus 'Disetujui' atau 'Ditolak'." },
        { status: 400 },
      );
    }
    const alasanTolak =
      keputusan === 'Ditolak' && typeof body.alasanTolak === 'string' && body.alasanTolak.trim()
        ? body.alasanTolak.trim()
        : null;

    const row = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { status: keputusan, alasanTolak, diprosesPada: new Date() },
    });

    // Cermin store.prosesIzin: pengajuan yang disetujui menjadi catatan presensi.
    if (keputusan === 'Disetujui' && row.siswaId) {
      await prisma.attendance.upsert({
        where: { siswaId_tanggal: { siswaId: row.siswaId, tanggal: row.tanggalMulai } },
        update: {
          status: row.jenis === 'Sakit' ? 'Sakit' : 'Izin',
          keterangan: row.alasan,
          waktu: '-',
        },
        create: {
          siswaId: row.siswaId,
          tanggal: row.tanggalMulai,
          waktu: '-',
          status: row.jenis === 'Sakit' ? 'Sakit' : 'Izin',
          keterangan: row.alasan,
        },
      });
    }

    return NextResponse.json(row);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`PATCH /api/izin/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}
