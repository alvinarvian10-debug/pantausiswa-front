import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/submisi/[id] — ambil satu pengumpulan (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}

// PATCH /api/submisi/[id] — guru memberi nilai + feedback
// body: { nilai: 0-100, feedback?: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const nilai = Number(body.nilai);
    if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
      return NextResponse.json(
        { error: 'Nilai harus angka 0-100.' },
        { status: 400 },
      );
    }

    const row = await prisma.submission.update({
      where: { id: params.id },
      data: {
        nilai: Math.round(nilai),
        feedback: typeof body.feedback === 'string' ? body.feedback : null,
        status: 'Dinilai',
      },
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
    console.error(`PATCH /api/submisi/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}
