import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

const TONES = ['emerald', 'blue', 'amber', 'red', 'slate'];

interface SiswaRow {
  nama?: unknown;
  nis?: unknown;
  kelasNama?: unknown;
}

// POST /api/import/siswa — impor massal [{ nama, nis, kelasNama }]
// Kelas belum ada otomatis dibuat (cocok nama case-insensitive).
// Duplikat NIS (di DB maupun dalam berkas) dilewati + dilaporkan.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body.rows) ? (body.rows as SiswaRow[]) : null;
    if (!rows) {
      return NextResponse.json({ error: 'rows wajib berupa array.' }, { status: 400 });
    }

    const existingNis = new Set(
      (await prisma.student.findMany({ select: { nis: true } })).map((s) => s.nis),
    );
    const kelasList = await prisma.schoolClass.findMany();
    const kelasByLower = new Map(kelasList.map((k) => [k.nama.toLowerCase(), k]));

    const skipped: { row: number; reason: string }[] = [];
    const toCreate: { nama: string; nis: string; kelasNama: string }[] = [];
    const createdKelas: { id: string; nama: string; waliKelasId: string | null }[] = [];
    let toneIdx = 0;

    // Kelas baru dibuat dulu agar dapat id (transaksi per batch di bawah).
    const kelasBaru = new Map<string, string>(); // lower -> nama asli
    rows.forEach((row, idx) => {
      const nama = String(row.nama ?? '').trim();
      const nis = row.nis != null ? String(row.nis).trim() : '';
      const kelasNama = String(row.kelasNama ?? '').trim();
      if (!nama || !nis || !kelasNama) {
        skipped.push({ row: idx + 2, reason: 'Nama, NIS, atau Kelas kosong' });
        return;
      }
      if (existingNis.has(nis)) {
        skipped.push({ row: idx + 2, reason: `NIS ${nis} sudah terdaftar` });
        return;
      }
      existingNis.add(nis);
      const lower = kelasNama.toLowerCase();
      if (!kelasByLower.has(lower) && !kelasBaru.has(lower)) {
        kelasBaru.set(lower, kelasNama);
      }
      toCreate.push({ nama, nis, kelasNama });
    });

    const result = await prisma.$transaction(async (tx) => {
      for (const [lower, namaAsli] of kelasBaru) {
        const k = await tx.schoolClass.create({ data: { nama: namaAsli } });
        kelasByLower.set(lower, k);
        createdKelas.push(k);
      }
      const created = [];
      for (const item of toCreate) {
        const kelas = kelasByLower.get(item.kelasNama.toLowerCase()) ?? null;
        created.push(
          await tx.student.create({
            data: {
              nama: item.nama,
              nis: item.nis,
              kelasId: kelas?.id ?? null,
              tone: TONES[toneIdx++ % TONES.length],
            },
          }),
        );
      }
      return created;
    });

    return NextResponse.json(
      { added: result.length, skipped, created: result, createdKelas },
      { status: 201 },
    );
  } catch (e) {
    console.error('POST /api/import/siswa failed:', e);
    return NextResponse.json(
      { error: 'Gagal impor ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
