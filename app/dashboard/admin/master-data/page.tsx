'use client';

import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  AvatarTone,
  Guru,
  Kelas,
  Siswa,
  useAppData,
} from '../../../../lib/store';

type Tab = 'siswa' | 'guru' | 'kelas';

const TONES: AvatarTone[] = ['emerald', 'blue', 'amber', 'red', 'slate'];

function asTone(t: unknown): AvatarTone {
  return (TONES as string[]).includes(String(t)) ? (t as AvatarTone) : 'emerald';
}

// Mapper baris DB (Prisma) → bentuk store lokal.
function toSiswa(r: { id: string; nama: string; nis: string; kelasId?: string | null; tone?: string }): Siswa {
  return { id: r.id, nama: r.nama, nis: r.nis, kelasId: r.kelasId ?? '', tone: asTone(r.tone) };
}
function toGuru(r: { id: string; nama: string; mapel?: string; waliKelasId?: string | null; tone?: string }): Guru {
  return {
    id: r.id,
    nama: r.nama,
    mapel: String(r.mapel ?? '').split(',').map((m) => m.trim()).filter(Boolean),
    waliKelasId: r.waliKelasId ?? null,
    tone: asTone(r.tone),
  };
}
function toKelas(r: { id: string; nama: string; waliKelasId?: string | null }): Kelas {
  return { id: r.id, nama: r.nama, waliKelasId: r.waliKelasId ?? null };
}

async function bacaError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  return data?.error ?? 'Gagal menghubungi database.';
}

interface ImportResult {
  type: 'siswa' | 'guru';
  added: number;
  skipped: { row: number; reason: string }[];
}

// ---------------------------------------------------------------------------
// Excel helpers
// ---------------------------------------------------------------------------

function downloadTemplate(type: 'siswa' | 'guru') {
  const headers =
    type === 'siswa' ? ['Nama', 'NIS', 'Kelas'] : ['Nama', 'Mata Pelajaran', 'Wali Kelas'];
  const example =
    type === 'siswa'
      ? ['Contoh Nama Siswa', '2024099', 'X IPA 1']
      : ['Contoh Nama Guru', 'Matematika, Fisika', 'X IPA 1'];
  const note =
    type === 'siswa'
      ? ['(hapus baris contoh ini sebelum diisi)', '', '(nama kelas baru otomatis dibuat jika belum ada)']
      : ['(hapus baris contoh ini sebelum diisi)', '(pisahkan dengan koma jika lebih dari satu)', '(boleh dikosongkan)'];

  const ws = XLSX.utils.aoa_to_sheet([headers, example, note]);
  ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `template_${type}.xlsx`);
}

async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]).trim();
  }
  return '';
}

// ---------------------------------------------------------------------------

export default function MasterDataPage() {
  const {
    siswa,
    guru,
    kelas,
    addSiswa,
    updateSiswa,
    deleteSiswa,
    addGuru,
    updateGuru,
    deleteGuru,
    addKelas,
    updateKelas,
    deleteKelas,
    upsertSiswa,
    upsertGuru,
    upsertKelas,
    adopsiIdSiswa,
    adopsiIdGuru,
    adopsiIdKelas,
  } = useAppData();

  const [tab, setTab] = useState<Tab>('siswa');
  const [query, setQuery] = useState('');
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [siswaModal, setSiswaModal] = useState<{ mode: 'add' | 'edit'; data?: Siswa } | null>(null);
  const [guruModal, setGuruModal] = useState<{ mode: 'add' | 'edit'; data?: Guru } | null>(null);
  const [kelasModal, setKelasModal] = useState<{ mode: 'add' | 'edit'; data?: Kelas } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'siswa' | 'guru' | 'kelas'; id: string; label: string } | null
  >(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const filteredSiswa = useMemo(
    () => siswa.filter((s) => s.nama.toLowerCase().includes(query.toLowerCase()) || s.nis.includes(query)),
    [siswa, query],
  );
  const filteredGuru = useMemo(
    () => guru.filter((g) => g.nama.toLowerCase().includes(query.toLowerCase())),
    [guru, query],
  );

  const kelasCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    siswa.forEach((s) => { map[s.kelasId] = (map[s.kelasId] ?? 0) + 1; });
    return map;
  }, [siswa]);

  // -- Helper sinkronisasi: POST/PATCH/DELETE ke API, lokal mengikuti DB --------

  async function tambahSiswaDB(values: { nama: string; nis: string; kelasId: string }): Promise<string | null> {
    const tone = TONES[siswa.length % TONES.length];
    const res = await fetch('/api/siswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, tone }),
    });
    if (!res.ok) throw new Error(await bacaError(res));
    const saved = await res.json();
    addSiswa({ ...values, tone, id: String(saved.id) });
    return null;
  }

  async function ubahSiswaDB(id: string, values: { nama: string; nis: string; kelasId: string }): Promise<string | null> {
    const res = await fetch(`/api/siswa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const saved = await res.json().catch(() => null);
      if (saved?.id) updateSiswa(id, values);
      else updateSiswa(id, values);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      // Data lama (S-xx): cocokkan via NIS lalu adopsi id DB.
      const listRes = await fetch('/api/siswa');
      const list = listRes.ok ? await listRes.json().catch(() => null) : null;
      const match = Array.isArray(list) ? list.find((r: { nis?: string }) => r.nis === values.nis) : null;
      if (match?.id) {
        const resRetry = await fetch(`/api/siswa/${match.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!resRetry.ok) throw new Error(await bacaError(resRetry));
        const saved = await resRetry.json().catch(() => null);
        adopsiIdSiswa(id, toSiswa(saved ?? { ...match, ...values }));
        return null;
      }
      // Belum ada di DB sama sekali: buatkan lalu adopsi.
      const resPost = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, tone: TONES[siswa.length % TONES.length] }),
      });
      if (!resPost.ok) throw new Error(await bacaError(resPost));
      const saved = await resPost.json();
      adopsiIdSiswa(id, toSiswa(saved));
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal update database.');
  }

  async function hapusSiswaDB(id: string): Promise<string | null> {
    const res = await fetch(`/api/siswa/${id}`, { method: 'DELETE' });
    if (res.ok) {
      deleteSiswa(id);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      deleteSiswa(id); // data lama lokal — cukup hapus lokal
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal hapus database.');
  }

  async function tambahGuruDB(values: { nama: string; mapel: string[]; waliKelasId: string | null }): Promise<string | null> {
    const tone = TONES[guru.length % TONES.length];
    const res = await fetch('/api/guru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, tone }),
    });
    if (!res.ok) throw new Error(await bacaError(res));
    const saved = await res.json();
    addGuru({ ...values, tone, id: String(saved.id) });
    return null;
  }

  async function ubahGuruDB(id: string, values: { nama: string; mapel: string[]; waliKelasId: string | null }): Promise<string | null> {
    const res = await fetch(`/api/guru/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      updateGuru(id, values);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      const listRes = await fetch('/api/guru');
      const list = listRes.ok ? await listRes.json().catch(() => null) : null;
      const match = Array.isArray(list) ? list.find((r: { nama?: string }) => r.nama === values.nama) : null;
      if (match?.id) {
        const resRetry = await fetch(`/api/guru/${match.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!resRetry.ok) throw new Error(await bacaError(resRetry));
        const saved = await resRetry.json().catch(() => null);
        adopsiIdGuru(id, toGuru(saved ?? { ...match, mapel: values.mapel.join(', '), waliKelasId: values.waliKelasId }));
        return null;
      }
      const resPost = await fetch('/api/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, tone: TONES[guru.length % TONES.length] }),
      });
      if (!resPost.ok) throw new Error(await bacaError(resPost));
      const saved = await resPost.json();
      adopsiIdGuru(id, toGuru(saved));
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal update database.');
  }

  async function hapusGuruDB(id: string): Promise<string | null> {
    const res = await fetch(`/api/guru/${id}`, { method: 'DELETE' });
    if (res.ok) {
      deleteGuru(id);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      deleteGuru(id);
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal hapus database.');
  }

  async function tambahKelasDB(values: { nama: string; waliKelasId: string | null }): Promise<string | null> {
    const res = await fetch('/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error(await bacaError(res));
    const saved = await res.json();
    addKelas({ ...values, id: String(saved.id) });
    return null;
  }

  async function ubahKelasDB(id: string, values: { nama: string; waliKelasId: string | null }): Promise<string | null> {
    const res = await fetch(`/api/kelas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      updateKelas(id, values);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      const listRes = await fetch('/api/kelas');
      const list = listRes.ok ? await listRes.json().catch(() => null) : null;
      const match = Array.isArray(list) ? list.find((r: { nama?: string }) => r.nama === values.nama) : null;
      if (match?.id) {
        const resRetry = await fetch(`/api/kelas/${match.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!resRetry.ok) throw new Error(await bacaError(resRetry));
        const saved = await resRetry.json().catch(() => null);
        adopsiIdKelas(id, toKelas(saved ?? { ...match, ...values }));
        return null;
      }
      const resPost = await fetch('/api/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!resPost.ok) throw new Error(await bacaError(resPost));
      const saved = await resPost.json();
      adopsiIdKelas(id, toKelas(saved));
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal update database.');
  }

  async function hapusKelasDB(id: string): Promise<string | null> {
    const res = await fetch(`/api/kelas/${id}`, { method: 'DELETE' });
    if (res.ok) {
      deleteKelas(id);
      return null;
    }
    const errBody = await res.json().catch(() => null);
    if (res.status === 404 || errBody?.code === 'NOT_FOUND') {
      deleteKelas(id);
      return null;
    }
    throw new Error(errBody?.error ?? 'Gagal hapus database.');
  }

  const handleImportClick = () => fileInputRef.current?.click();

  // Gabungkan baris hasil impor server ke lokal; baris lokal dengan kunci
  // sama (NIS/nama) dimigrasi ke id DB agar tidak ganda.
  function gabungKelasImpor(list: { id: string; nama: string; waliKelasId?: string | null }[]) {
    for (const k of list) {
      const row = toKelas(k);
      const lokal = kelas.find((x) => x.id !== row.id && x.nama.toLowerCase() === row.nama.toLowerCase());
      if (lokal) adopsiIdKelas(lokal.id, row);
      else upsertKelas(row);
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setImporting(true);
    setDbError('');
    setDbNotice('');
    try {
      const rows = await parseExcelFile(file);
      if (tab === 'siswa') {
        const mapped = rows.map((r) => ({
          nama: cell(r, 'Nama', 'nama'),
          nis: cell(r, 'NIS', 'nis'),
          kelasNama: cell(r, 'Kelas', 'kelas'),
        }));
        const res = await fetch('/api/import/siswa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: mapped }),
        });
        if (!res.ok) throw new Error(await bacaError(res));
        const data = await res.json();
        gabungKelasImpor(data.createdKelas ?? []);
        for (const s of data.created ?? []) {
          const row = toSiswa(s);
          const lokal = siswa.find((x) => x.id !== row.id && x.nis === row.nis);
          if (lokal) adopsiIdSiswa(lokal.id, row);
          else upsertSiswa(row);
        }
        setImportResult({ type: 'siswa', added: data.added, skipped: data.skipped ?? [] });
        setDbNotice(`${data.added} siswa tersimpan di database XAMPP.`);
      } else if (tab === 'guru') {
        const mapped = rows.map((r) => ({
          nama: cell(r, 'Nama', 'nama'),
          mapel: cell(r, 'Mata Pelajaran', 'mapel').split(',').map((m) => m.trim()).filter(Boolean),
          waliKelasNama: cell(r, 'Wali Kelas', 'wali kelas') || null,
        }));
        const res = await fetch('/api/import/guru', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: mapped }),
        });
        if (!res.ok) throw new Error(await bacaError(res));
        const data = await res.json();
        gabungKelasImpor(data.createdKelas ?? []);
        for (const g of data.created ?? []) {
          const row = toGuru(g);
          const lokal = guru.find((x) => x.id !== row.id && x.nama === row.nama);
          if (lokal) adopsiIdGuru(lokal.id, row);
          else upsertGuru(row);
        }
        setImportResult({ type: 'guru', added: data.added, skipped: data.skipped ?? [] });
        setDbNotice(`${data.added} guru tersimpan di database XAMPP.`);
      }
    } catch (err) {
      const pesan =
        err instanceof Error && err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'Berkas tidak dapat dibaca. Pastikan format .xlsx sesuai template.';
      setDbError(pesan);
      setImportResult({
        type: tab === 'guru' ? 'guru' : 'siswa',
        added: 0,
        skipped: [{ row: 0, reason: pesan }],
      });
    } finally {
      setImporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    const target = deleteTarget;
    setBusy(true);
    setDbError('');
    setDbNotice('');
    try {
      if (target.type === 'siswa') await hapusSiswaDB(target.id);
      if (target.type === 'guru') await hapusGuruDB(target.id);
      if (target.type === 'kelas') await hapusKelasDB(target.id);
      setDbNotice(`"${target.label}" dihapus dari database.`);
      setDeleteTarget(null);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Gagal hapus database.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Master Data</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Pusat data siswa, guru, dan kelas — sumber data yang sama dipakai
            oleh seluruh fitur di portal siswa dan guru. Tambah lewat impor
            Excel atau satu-satu secara manual.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">school</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{siswa.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Siswa</span>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">groups</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{guru.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Guru</span>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">meeting_room</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{kelas.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Kelas</span>
          </div>
        </GlassCard>
      </StaggerGroup>

      {dbNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          {dbNotice}
        </div>
      )}
      {dbError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">error</span>
          {dbError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 border-b border-slate-100">
          {([
            { key: 'siswa', label: 'Siswa', icon: 'school' },
            { key: 'guru', label: 'Guru', icon: 'groups' },
            { key: 'kelas', label: 'Kelas', icon: 'meeting_room' },
          ] as { key: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="material-symbols-outlined icon-fill text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'kelas' && (
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau NIS…"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        )}
      </div>

      {/* Action toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {tab !== 'kelas' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              type="button"
              onClick={() => downloadTemplate(tab)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Unduh Template Excel
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">
                {importing ? 'progress_activity' : 'upload_file'}
              </span>
              {importing ? 'Mengimpor…' : 'Impor dari Excel'}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            if (tab === 'siswa') setSiswaModal({ mode: 'add' });
            if (tab === 'guru') setGuruModal({ mode: 'add' });
            if (tab === 'kelas') setKelasModal({ mode: 'add' });
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Manual
        </button>
      </div>

      {/* Siswa table */}
      {tab === 'siswa' && (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">NIS</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.nama} tone={s.tone} className="h-9 w-9 text-xs" />
                        <span className="font-medium text-gray-900">{s.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{s.nis}</td>
                    <td className="px-6 py-4 text-gray-500">{kelas.find((k) => k.id === s.kelasId)?.nama ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${s.nama}`}
                          onClick={() => setSiswaModal({ mode: 'edit', data: s })}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${s.nama}`}
                          onClick={() => setDeleteTarget({ type: 'siswa', id: s.id, label: s.nama })}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSiswa.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                      Belum ada data siswa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}

      {/* Guru table */}
      {tab === 'guru' && (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                  <th className="px-6 py-4 font-semibold">Wali Kelas</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuru.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={g.nama} tone={g.tone} className="h-9 w-9 text-xs" />
                        <span className="font-medium text-gray-900">{g.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{g.mapel.join(', ')}</td>
                    <td className="px-6 py-4 text-gray-500">{kelas.find((k) => k.id === g.waliKelasId)?.nama ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${g.nama}`}
                          onClick={() => setGuruModal({ mode: 'edit', data: g })}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${g.nama}`}
                          onClick={() => setDeleteTarget({ type: 'guru', id: g.id, label: g.nama })}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGuru.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                      Belum ada data guru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}

      {/* Kelas grid */}
      {tab === 'kelas' && (
        <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kelas.map((k) => (
            <GlassCard key={k.id} className="p-6">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <span className="material-symbols-outlined icon-fill text-[22px]">meeting_room</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${k.nama}`}
                    onClick={() => setKelasModal({ mode: 'edit', data: k })}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${k.nama}`}
                    onClick={() => setDeleteTarget({ type: 'kelas', id: k.id, label: k.nama })}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{k.nama}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Wali Kelas: {guru.find((g) => g.id === k.waliKelasId)?.nama ?? '-'}
              </p>
              <p className="mt-1 text-sm text-gray-500">{kelasCountMap[k.id] ?? 0} siswa</p>
            </GlassCard>
          ))}
          {kelas.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
              Belum ada data kelas.
            </div>
          )}
        </StaggerGroup>
      )}

      {/* ---------------- Modals ---------------- */}

      {siswaModal && (
        <SiswaFormModal
          mode={siswaModal.mode}
          initial={siswaModal.data}
          kelasList={kelas}
          onClose={() => setSiswaModal(null)}
          onSubmit={async (values) => {
            setDbError('');
            setDbNotice('');
            try {
              if (siswaModal.mode === 'add') {
                await tambahSiswaDB(values);
                setDbNotice(`Siswa "${values.nama}" tersimpan di database.`);
              } else if (siswaModal.data) {
                await ubahSiswaDB(siswaModal.data.id, values);
                setDbNotice(`Perubahan "${values.nama}" tersimpan di database.`);
              }
              setSiswaModal(null);
              return null;
            } catch (err) {
              return err instanceof Error ? err.message : 'Gagal menyimpan ke database.';
            }
          }}
        />
      )}

      {guruModal && (
        <GuruFormModal
          mode={guruModal.mode}
          initial={guruModal.data}
          kelasList={kelas}
          onClose={() => setGuruModal(null)}
          onSubmit={async (values) => {
            setDbError('');
            setDbNotice('');
            try {
              if (guruModal.mode === 'add') {
                await tambahGuruDB(values);
                setDbNotice(`Guru "${values.nama}" tersimpan di database.`);
              } else if (guruModal.data) {
                await ubahGuruDB(guruModal.data.id, values);
                setDbNotice(`Perubahan "${values.nama}" tersimpan di database.`);
              }
              setGuruModal(null);
              return null;
            } catch (err) {
              return err instanceof Error ? err.message : 'Gagal menyimpan ke database.';
            }
          }}
        />
      )}

      {kelasModal && (
        <KelasFormModal
          mode={kelasModal.mode}
          initial={kelasModal.data}
          guruList={guru}
          onClose={() => setKelasModal(null)}
          onSubmit={async (values) => {
            setDbError('');
            setDbNotice('');
            try {
              if (kelasModal.mode === 'add') {
                await tambahKelasDB(values);
                setDbNotice(`Kelas "${values.nama}" tersimpan di database.`);
              } else if (kelasModal.data) {
                await ubahKelasDB(kelasModal.data.id, values);
                setDbNotice(`Perubahan "${values.nama}" tersimpan di database.`);
              }
              setKelasModal(null);
              return null;
            } catch (err) {
              return err instanceof Error ? err.message : 'Gagal menyimpan ke database.';
            }
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.label}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {importResult && (
        <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Modal: Add/Edit Siswa
// ---------------------------------------------------------------------------

function SiswaFormModal({
  mode,
  initial,
  kelasList,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  initial?: Siswa;
  kelasList: Kelas[];
  onClose: () => void;
  onSubmit: (values: { nama: string; nis: string; kelasId: string }) => Promise<string | null>;
}) {
  const [nama, setNama] = useState(initial?.nama ?? '');
  const [nis, setNis] = useState(initial?.nis ?? '');
  const [kelasId, setKelasId] = useState(initial?.kelasId ?? kelasList[0]?.id ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!nama.trim() || !nis.trim() || !kelasId) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    const err = await onSubmit({ nama: nama.trim(), nis: nis.trim(), kelasId });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === 'add' ? 'Tambah Siswa Manual' : 'Edit Data Siswa'}
        </h2>
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Rizky Ramadhan"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">NIS</label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              placeholder="Contoh: 2024010"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Kelas</label>
            {kelasList.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Belum ada data kelas — tambahkan kelas terlebih dahulu di tab Kelas.
              </p>
            ) : (
              <select
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={kelasList.length === 0 || saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
            >
              {saving ? 'Menyimpan...' : mode === 'add' ? 'Tambah Siswa' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Add/Edit Guru
// ---------------------------------------------------------------------------

function GuruFormModal({
  mode,
  initial,
  kelasList,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  initial?: Guru;
  kelasList: Kelas[];
  onClose: () => void;
  onSubmit: (values: { nama: string; mapel: string[]; waliKelasId: string | null }) => Promise<string | null>;
}) {
  const [nama, setNama] = useState(initial?.nama ?? '');
  const [mapelText, setMapelText] = useState(initial?.mapel.join(', ') ?? '');
  const [waliKelasId, setWaliKelasId] = useState<string>(initial?.waliKelasId ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const mapel = mapelText.split(',').map((m) => m.trim()).filter(Boolean);
    if (!nama.trim() || mapel.length === 0) {
      setError('Nama dan minimal satu mata pelajaran wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    const err = await onSubmit({ nama: nama.trim(), mapel, waliKelasId: waliKelasId || null });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === 'add' ? 'Tambah Guru Manual' : 'Edit Data Guru'}
        </h2>
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Ibu Dewi Kartika"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <input
              type="text"
              value={mapelText}
              onChange={(e) => setMapelText(e.target.value)}
              placeholder="Contoh: Fisika, Kimia"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-gray-400">Pisahkan dengan koma jika lebih dari satu.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Wali Kelas (opsional)</label>
            <select
              value={waliKelasId}
              onChange={(e) => setWaliKelasId(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Tidak menjadi wali kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              Memilih kelas yang sudah punya wali kelas akan menggantikan wali kelas sebelumnya.
            </p>
          </div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
            >
              {saving ? 'Menyimpan...' : mode === 'add' ? 'Tambah Guru' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Add/Edit Kelas
// ---------------------------------------------------------------------------

function KelasFormModal({
  mode,
  initial,
  guruList,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  initial?: Kelas;
  guruList: Guru[];
  onClose: () => void;
  onSubmit: (values: { nama: string; waliKelasId: string | null }) => Promise<string | null>;
}) {
  const [nama, setNama] = useState(initial?.nama ?? '');
  const [waliKelasId, setWaliKelasId] = useState<string>(initial?.waliKelasId ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!nama.trim()) {
      setError('Nama kelas wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    const err = await onSubmit({ nama: nama.trim(), waliKelasId: waliKelasId || null });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-sm overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === 'add' ? 'Tambah Kelas' : 'Edit Data Kelas'}
        </h2>
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nama Kelas</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: XI IPA 3"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Wali Kelas (opsional)</label>
            <select
              value={waliKelasId}
              onChange={(e) => setWaliKelasId(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Belum ditentukan</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>{g.nama}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
            >
              {saving ? 'Menyimpan...' : mode === 'add' ? 'Tambah Kelas' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Confirm Delete
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  label,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-sm p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
          <span className="material-symbols-outlined icon-fill text-[28px]">warning</span>
        </span>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Hapus Data Ini?</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kamu akan menghapus <span className="font-semibold text-gray-700">{label}</span>. Tindakan
          ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-500/70"
          >
            {busy ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Import Result
// ---------------------------------------------------------------------------

function ImportResultModal({ result, onClose }: { result: ImportResult; onClose: () => void }) {
  const success = result.skipped.length === 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-inset ${success ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-amber-50 text-amber-600 ring-amber-100'}`}>
          <span className="material-symbols-outlined icon-fill text-[28px]">
            {success ? 'check_circle' : 'info'}
          </span>
        </span>
        <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">Impor Selesai</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          <span className="font-semibold text-emerald-600">{result.added}</span> data{' '}
          {result.type === 'siswa' ? 'siswa' : 'guru'} berhasil ditambahkan.
        </p>

        {result.skipped.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {result.skipped.length} baris dilewati
            </p>
            <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {result.skipped.map((s, i) => (
                <li key={i} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {s.row > 0 ? `Baris ${s.row}: ` : ''}{s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Tutup
        </button>
      </GlassCard>
    </div>
  );
}
