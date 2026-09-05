import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

const TONES = ['emerald', 'blue', 'amber', 'red', 'slate'];

interface GuruRow {
  nama?: unknown;
  mapel?: unknown;
  waliKelasNama?: unknown;
}

// POST /api/import/guru — impor massal [{ nama, mapel[], waliKelasNama? }]
// Kelas wali belum ada otomatis dibuat; wali kelas unik (guru lama dilepas).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body.rows) ? (body.rows as GuruRow[]) : null;
    if (!rows) {
      return NextResponse.json({ error: 'rows wajib berupa array.' }, { status: 400 });
    }

    const skipped: { row: number; reason: string }[] = [];
    const valid: { nama: string; csv: string; waliKelasNama: string | null }[] = [];
    rows.forEach((row, idx) => {
      const nama = String(row.nama ?? '').trim();
      const mapel = (Array.isArray(row.mapel) ? row.mapel : String(row.mapel ?? '').split(','))
        .map((m) => String(m).trim())
        .filter(Boolean);
      const waliKelasNama =
        row.waliKelasNama != null && String(row.waliKelasNama).trim()
          ? String(row.waliKelasNama).trim()
          : null;
      if (!nama || mapel.length === 0) {
        skipped.push({ row: idx + 2, reason: 'Nama atau Mata Pelajaran kosong' });
        return;
      }
      valid.push({ nama, csv: mapel.join(', '), waliKelasNama });
    });

    const kelasList = await prisma.schoolClass.findMany();
    const kelasByLower = new Map(kelasList.map((k) => [k.nama.toLowerCase(), k]));
    const createdKelas: { id: string; nama: string; waliKelasId: string | null }[] = [];
    let toneIdx = (await prisma.teacher.count()) % TONES.length;

    const created = await prisma.$transaction(async (tx) => {
      // Pastikan semua kelas wali ada dulu.
      for (const v of valid) {
        if (!v.waliKelasNama) continue;
        const lower = v.waliKelasNama.toLowerCase();
        if (!kelasByLower.has(lower)) {
          const k = await tx.schoolClass.create({ data: { nama: v.waliKelasNama } });
          kelasByLower.set(lower, k);
          createdKelas.push(k);
        }
      }
      const out = [];
      for (const v of valid) {
        let waliKelasId: string | null = null;
        if (v.waliKelasNama) {
          const k = kelasByLower.get(v.waliKelasNama.toLowerCase()) ?? null;
          waliKelasId = k?.id ?? null;
          if (waliKelasId) {
            await tx.teacher.updateMany({
              where: { waliKelasId },
              data: { waliKelasId: null },
            });
          }
        }
        const guru = await tx.teacher.create({
          data: {
            nama: v.nama,
            mapel: v.csv,
            waliKelasId,
            tone: TONES[toneIdx++ % TONES.length],
          },
        });
        // Cermin bulkImportGuru: sisi kelas menunjuk ke guru baru.
        if (waliKelasId) {
          await tx.schoolClass.update({
            where: { id: waliKelasId },
            data: { waliKelasId: guru.id },
          });
          const cached = kelasByLower.get(v.waliKelasNama!.toLowerCase());
          if (cached) cached.waliKelasId = guru.id;
        }
        out.push(guru);
      }
      return out;
    });

    // createdKelas dikembalikan dengan waliKelasId terkini.
    const segar = createdKelas.map(
      (k) => kelasByLower.get(k.nama.toLowerCase()) ?? k,
    );
    return NextResponse.json(
      { added: created.length, skipped, created, createdKelas: segar },
      { status: 201 },
    );
  } catch (e) {
    console.error('POST /api/import/guru failed:', e);
    return NextResponse.json(
      { error: 'Gagal impor ke database. Pastikan MySQL XAMPP jalan.' },
      { status: 500 },
    );
  }
}
