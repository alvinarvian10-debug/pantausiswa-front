import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// PATCH /api/complaints/[id] — update status / tanggapan admin
// body: { status?: 'Baru'|'Proses'|'Selesai', tanggapan?: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.status === 'string') data.status = body.status;
    if (typeof body.tanggapan === 'string') data.adminResponse = body.tanggapan;
    if (typeof body.adminResponse === 'string') data.adminResponse = body.adminResponse;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field untuk diupdate.' }, { status: 400 });
    }

    const row = await prisma.complaint.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    // P2025 = baris tidak ada di DB (mis. data seed lokal AD-01). Kirim 404
    // agar frontend bisa fallback POST (buat barisnya) alih-alih gagal diam-diam.
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`PATCH /api/complaints/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}

// GET /api/complaints/[id] — ambil satu baris (untuk verifikasi)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!row) {
    return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(row);
}
