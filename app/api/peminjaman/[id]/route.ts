import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/peminjaman/[id] — ambil satu peminjaman (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.loan.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}

// PATCH /api/peminjaman/[id] — pengembalian fasilitas.
// Transaksi atomik: tandai Dikembalikan + kembalikan 1 stok (dibatasi total).
// Idempoten: pengembalian ganda tidak menambah stok dua kali.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const status = String(body.status ?? 'Dikembalikan').trim();
    if (status !== 'Dikembalikan') {
      return NextResponse.json(
        { error: "Status hanya mendukung 'Dikembalikan'." },
        { status: 400 },
      );
    }

    const row = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: params.id } });
      if (!loan) return null;
      if (loan.status === 'Dikembalikan') return loan;
      const updated = await tx.loan.update({
        where: { id: params.id },
        data: { status: 'Dikembalikan' },
      });
      if (loan.fasilitasId) {
        const facility = await tx.facility.findUnique({ where: { id: loan.fasilitasId } });
        if (facility) {
          await tx.facility.update({
            where: { id: facility.id },
            data: { jumlahTersedia: Math.min(facility.jumlahTersedia + 1, facility.jumlahTotal) },
          });
        }
      }
      return updated;
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    return NextResponse.json(row);
  } catch (e) {
    console.error(`PATCH /api/peminjaman/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}
