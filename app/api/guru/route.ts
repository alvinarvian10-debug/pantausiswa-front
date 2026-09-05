import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { mapelToCsv } from '../../../lib/guru';

const TONES = ['emerald', 'blue', 'amber', 'red', 'slate'] as const;

// GET /api/guru — daftar guru
export async function GET() {
  try {
    const rows = await prisma.teacher.findMany({ orderBy: { nama: 'asc' } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/guru failed:', e);
    return NextResponse.json(
      { error: 'Gagal mengambil data dari database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}

// POST /api/guru — tambah guru ({ nama, mapel[]|string, waliKelasId?, tone? })
// Satu kelas satu wali: guru lain dengan waliKelasId sama dilepas (cermin store).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nama = String(body.nama ?? '').trim();
    const csv = mapelToCsv(body.mapel);
    if (!nama || !csv) {
      return NextResponse.json(
        { error: 'Nama dan minimal satu mata pelajaran wajib diisi.' },
        { status: 400 },
      );
    }
    const waliKelasId = body.waliKelasId ? String(body.waliKelasId) : null;
    const tone = String(body.tone ?? 'emerald');

    const row = await prisma.$transaction(async (tx) => {
      if (waliKelasId) {
        await tx.teacher.updateMany({
          where: { waliKelasId },
          data: { waliKelasId: null },
        });
      }
      return tx.teacher.create({
        data: {
          nama,
          mapel: csv,
          waliKelasId,
          tone: TONES.includes(tone as (typeof TONES)[number]) ? tone : 'emerald',
        },
      });
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/guru failed:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
