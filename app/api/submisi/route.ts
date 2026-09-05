import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/submisi — daftar semua pengumpulan (untuk guru / verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.submission.findMany({
      orderBy: { dikumpulkanPada: 'desc' },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/submisi failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/submisi — siswa mengumpulkan (atau mengumpulkan ulang) tugas.
// Upsert per (tugasId, siswaId): kirim ulang menimpa nilai/feedback jadi
// "Menunggu Nilai" lagi — cermin perilaku store.submitTugas.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tugasId = String(body.tugasId ?? '').trim();
    const siswaId = String(body.siswaId ?? '').trim();
    const konten = String(body.konten ?? '');
    if (!tugasId || !siswaId || !konten) {
      return NextResponse.json(
        { error: 'tugasId, siswaId, dan konten wajib diisi.' },
        { status: 400 },
      );
    }
    const tipe = String(body.tipe ?? 'File').trim();
    if (!['Foto', 'File', 'Link'].includes(tipe)) {
      return NextResponse.json(
        { error: 'Tipe harus Foto/File/Link.' },
        { status: 400 },
      );
    }

    const row = await prisma.submission.upsert({
      where: { tugasId_siswaId: { tugasId, siswaId } },
      update: { tipe, konten, dikumpulkanPada: new Date(), status: 'Menunggu Nilai', nilai: null, feedback: null },
      create: { tugasId, siswaId, tipe, konten, status: 'Menunggu Nilai' },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/submisi failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
