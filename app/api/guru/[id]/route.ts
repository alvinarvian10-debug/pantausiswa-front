import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { mapelToCsv } from '../../../../lib/guru';

// GET /api/guru/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const row = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/guru/[id] — { nama?, mapel?, waliKelasId? }
// Wali kelas unik: guru lain dengan kelas yang sama dilepas dulu.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const data: { nama?: string; mapel?: string; waliKelasId?: string | null; tone?: string } = {};
    if (body.nama != null) {
      const nama = String(body.nama).trim();
      if (!nama) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
      data.nama = nama;
    }
    if (body.mapel != null) {
      const csv = mapelToCsv(body.mapel);
      if (!csv) return NextResponse.json({ error: 'Minimal satu mata pelajaran wajib diisi.' }, { status: 400 });
      data.mapel = csv;
    }
    if (body.waliKelasId !== undefined) {
      data.waliKelasId = body.waliKelasId ? String(body.waliKelasId) : null;
    }
    if (body.tone != null) data.tone = String(body.tone);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field untuk diupdate.' }, { status: 400 });
    }

    const row = await prisma.$transaction(async (tx) => {
      if (data.waliKelasId) {
        await tx.teacher.updateMany({
          where: { waliKelasId: data.waliKelasId, NOT: { id: params.id } },
          data: { waliKelasId: null },
        });
      }
      return tx.teacher.update({ where: { id: params.id }, data });
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`PATCH /api/guru/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal update database.' }, { status: 500 });
  }
}

// DELETE /api/guru/[id] — lepas wali kelas + hapus tugas & pengumpulannya
// (cermin store.deleteGuru; submisi yatim ikut dibersihkan agar DB rapi)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.schoolClass.updateMany({
        where: { waliKelasId: params.id },
        data: { waliKelasId: null },
      });
      const tugas = await tx.assignment.findMany({
        where: { guruId: params.id },
        select: { id: true },
      });
      if (tugas.length > 0) {
        await tx.submission.deleteMany({
          where: { tugasId: { in: tugas.map((t) => t.id) } },
        });
        await tx.assignment.deleteMany({ where: { guruId: params.id } });
      }
      await tx.teacher.delete({ where: { id: params.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Data tidak ditemukan di database (NOT_FOUND).', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    console.error(`DELETE /api/guru/${params.id} failed:`, e);
    return NextResponse.json({ error: 'Gagal hapus database.' }, { status: 500 });
  }
}
