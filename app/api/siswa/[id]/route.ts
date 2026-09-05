import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/siswa/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.student.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/siswa/[id] — { nama?, nis?, kelasId?, tone? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const data: { nama?: string; nis?: string; kelasId?: string | null; tone?: string } = {};
    if (body.nama != null) {
      const nama = String(body.nama).trim();
      if (!nama) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
      data.nama = nama;
    }
    if (body.nis != null) {
      const nis = String(body.nis).trim();
      if (!nis) return NextResponse.json({ error: 'NIS wajib diisi.' }, { status: 400 });
      data.nis = nis;
    }
    if (body.kelasId !== undefined) data.kelasId = body.kelasId ? String(body.kelasId) : null;
    if (body.tone != null) data.tone = String(body.tone);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field untuk diupdate.' }, { status: 400 });
    }
    const row = await prisma.student.update({ where: { id: params.id }, data });
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
      return NextResponse.json({ error: 'NIS sudah terdaftar.' }, { status: 409 });
    }
    console.error(`PATCH /api/siswa/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}

// DELETE /api/siswa/[id] — cermin cascade store.deleteSiswa
// (attendance, leaverequest, loan, submission, complaint milik siswa ikut dihapus)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { siswaId: params.id } }),
      prisma.leaveRequest.deleteMany({ where: { siswaId: params.id } }),
      prisma.loan.deleteMany({ where: { siswaId: params.id } }),
      prisma.submission.deleteMany({ where: { siswaId: params.id } }),
      prisma.complaint.deleteMany({ where: { siswaId: params.id } }),
      prisma.student.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`DELETE /api/siswa/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal hapus database.' }, { status: 500 });
  }
}
