import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

const KONDISI = ['Baik', 'Rusak', 'Diperbaiki'] as const;

// GET /api/fasilitas/[id] — ambil satu fasilitas (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.facility.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}

// PATCH /api/fasilitas/[id] — admin ubah kondisi.
// Cermin store.updateKondisiFasilitas: kondisi selain Baik → stok tersedia 0.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const kondisi = String(body.kondisi ?? '').trim();
    if (!KONDISI.includes(kondisi as (typeof KONDISI)[number])) {
      return NextResponse.json(
        { error: 'Kondisi harus Baik/Rusak/Diperbaiki.' },
        { status: 400 },
      );
    }

    const row = await prisma.facility.update({
      where: { id: params.id },
      data: { kondisi, ...(kondisi !== 'Baik' ? { jumlahTersedia: 0 } : {}) },
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`PATCH /api/fasilitas/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}
