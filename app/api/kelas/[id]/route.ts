import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/kelas/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.schoolClass.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/kelas/[id] — { nama?, waliKelasId? } (null/'' melepas wali)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const data: { nama?: string; waliKelasId?: string | null } = {};
    if (body.nama != null) {
      const nama = String(body.nama).trim();
      if (!nama) return NextResponse.json({ error: 'Nama kelas wajib diisi.' }, { status: 400 });
      data.nama = nama;
    }
    if (body.waliKelasId !== undefined) {
      data.waliKelasId = body.waliKelasId ? String(body.waliKelasId) : null;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field untuk diupdate.' }, { status: 400 });
    }
    const row = await prisma.schoolClass.update({ where: { id: params.id }, data });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Nama kelas sudah terdaftar.' }, { status: 409 });
    }
    console.error(`PATCH /api/kelas/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}

// DELETE /api/kelas/[id] — cermin store.deleteKelas (siswa/guru terkait dibiarkan)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.schoolClass.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`DELETE /api/kelas/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal hapus database.' }, { status: 500 });
  }
}
