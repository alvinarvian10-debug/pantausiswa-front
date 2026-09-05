import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/tugas/[id] — ambil satu tugas (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.assignment.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}
