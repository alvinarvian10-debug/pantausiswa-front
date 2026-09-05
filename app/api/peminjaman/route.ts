import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/peminjaman — daftar semua peminjaman (untuk verifikasi DB)
export async function GET() {
  try {
    const rows = await prisma.loan.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/peminjaman failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/peminjaman — siswa meminjam fasilitas.
// Transaksi atomik: cek kondisi+stok → kurangi stok → buat loan.
// Fasilitas seed lokal (id F-xx) dicocokkan via nama bila id tak dikenal.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fasilitasId = String(body.fasilitasId ?? '').trim();
    const fasilitasNama = String(body.fasilitasNama ?? '').trim();
    const keperluan = String(body.keperluan ?? '').trim();
    if (!fasilitasId || !keperluan) {
      return NextResponse.json(
        { error: 'fasilitasId dan keperluan wajib diisi.' },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let facility = await tx.facility.findUnique({ where: { id: fasilitasId } });
      if (!facility && fasilitasNama) {
        facility = await tx.facility.findFirst({ where: { nama: fasilitasNama } });
      }
      // Daftarkan fasilitas seed lokal ke DB bila belum ada (stok dari data lokal).
      if (!facility && fasilitasNama) {
        const jumlahTotal = Number(body.jumlahTotal ?? 1) || 1;
        facility = await tx.facility.create({
          data: {
            nama: fasilitasNama,
            kategori: String(body.kategori ?? 'Elektronik'),
            icon: body.icon ? String(body.icon) : 'inventory_2',
            jumlahTotal,
            jumlahTersedia: jumlahTotal,
            kondisi: 'Baik',
          },
        });
      }
      if (!facility) {
        return { error: 'Fasilitas tidak ditemukan.', status: 404 as const };
      }
      if (facility.kondisi !== 'Baik') {
        return { error: `Fasilitas sedang ${facility.kondisi}.`, status: 409 as const };
      }
      if (facility.jumlahTersedia < 1) {
        return { error: 'Stok fasilitas habis.', status: 409 as const };
      }
      await tx.facility.update({
        where: { id: facility.id },
        data: { jumlahTersedia: { decrement: 1 } },
      });
      const loan = await tx.loan.create({
        data: {
          siswaId: body.siswaId ? String(body.siswaId) : null,
          fasilitasId: facility.id,
          keperluan,
          tanggalPinjam: body.tanggalPinjam
            ? String(body.tanggalPinjam)
            : new Date().toISOString().slice(0, 10),
          batasKembali: body.batasKembali ? String(body.batasKembali) : '-',
          status: 'Dipinjam',
        },
      });
      return { loan, status: 201 as const };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      { ...result.loan, resolvedFasilitasId: result.loan.fasilitasId },
      { status: 201 },
    );
  } catch (e) {
    console.error('POST /api/peminjaman failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
