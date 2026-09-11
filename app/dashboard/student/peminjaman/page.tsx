'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  apiCreatePeminjaman,
  apiKembalikanMandiri,
  apiListBarang,
  apiMyPeminjaman,
  formatTanggalJam,
  kondisiToFront,
  type BackendBarang,
  type BackendPeminjaman,
} from '../../../../lib/api';
import { CURRENT_SISWA_ID, Fasilitas, useAppData } from '../../../../lib/store';

const CATEGORIES = ['Semua', 'Ruangan', 'Elektronik', 'Olahraga'] as const;

const CATEGORY_CHIP: Record<string, string> = {
  Ruangan: 'bg-blue-50 text-blue-700 ring-blue-100',
  Elektronik: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Olahraga: 'bg-orange-50 text-orange-700 ring-orange-100',
};

const KONDISI_STYLE: Record<string, string> = {
  Baik: '',
  Rusak: 'bg-red-50 text-red-600 ring-red-100',
  Diperbaiki: 'bg-amber-50 text-amber-600 ring-amber-100',
};

export default function PeminjamanPage() {
  const { fasilitas, peminjaman, getFasilitas, ajukanPeminjaman, kembalikanPeminjaman } = useAppData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Semua');
  const [pickedFasilitas, setPickedFasilitas] = useState<FasilitasView | null>(null);
  const [keperluan, setKeperluan] = useState('');
  // Task 3: info tambahan — alasan (wajib di UI) + bukti URL (opsional).
  const [alasan, setAlasan] = useState('');
  const [bukti, setBukti] = useState('');
  // Pre-order: dua DateTime input (mulai pinjam + batas kembali).
  // Format datetime-local: "YYYY-MM-DDTHH:mm".
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [tanggalPinjamInput, setTanggalPinjamInput] = useState(() =>
    toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [tanggalKembaliInput, setTanggalKembaliInput] = useState(() =>
    toLocalInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  );
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sumber kebenaran: backend bila terjangkau (stok + riwayat), lokal bila tidak.
  const [beBarang, setBeBarang] = useState<BackendBarang[] | null>(null);
  const [bePinjam, setBePinjam] = useState<BackendPeminjaman[] | null>(null);

  const muatBackend = async () => {
    try {
      const [b, p] = await Promise.all([apiListBarang(), apiMyPeminjaman()]);
      setBeBarang(b);
      setBePinjam(p.data);
    } catch {
      setBeBarang(null);
      setBePinjam(null);
    }
  };

  useEffect(() => {
    muatBackend();
  }, []);

  interface FasilitasView {
    key: string;
    backendId: number | null;
    nama: string;
    kategori: string;
    icon: string;
    jumlahTotal: number;
    jumlahTersedia: number;
    kondisi: 'Baik' | 'Rusak' | 'Diperbaiki';
  }

  const daftarFasilitas: FasilitasView[] = useMemo(() => {
    if (beBarang !== null) {
      return beBarang.map((b) => ({
        key: `be-${b.id}`,
        backendId: b.id,
        nama: b.nama,
        kategori: b.kategori,
        icon: b.icon ?? 'inventory_2',
        jumlahTotal: b.jumlahTotal,
        jumlahTersedia: b.jumlahTersedia,
        // Tri-state penuh: RUSAK_RINGAN -> 'Diperbaiki' (bukan 'Rusak').
        kondisi: kondisiToFront(b.kondisi),
      }));
    }
    return fasilitas.map((f) => ({
      key: `lokal-${f.id}`,
      backendId: Number.isInteger(Number(f.id)) ? Number(f.id) : null,
      nama: f.nama,
      kategori: f.kategori,
      icon: f.icon,
      jumlahTotal: f.jumlahTotal,
      jumlahTersedia: f.jumlahTersedia,
      kondisi: f.kondisi,
    }));
  }, [beBarang, fasilitas]);

  interface PinjamanView {
    key: string;
    backendId: number | null;
    nama: string;
    icon: string;
    keperluan: string;
    batasLabel: string;
    status?: string;
    loanIdLokal: string | null;
  }

  const myLoans: PinjamanView[] = useMemo(() => {
    if (bePinjam !== null) {
      return bePinjam
        .filter((p) => p.status === 'DIPINJAM')
        .map((p) => ({
          key: `be-${p.id}`,
          backendId: p.id,
          nama: p.barang?.nama ?? '-',
          icon: p.barang?.icon ?? 'inventory_2',
          keperluan: p.catatan ?? '',
          batasLabel: `${formatTanggalJam(p.tanggalPinjam)} → ${formatTanggalJam(p.tanggalKembali)}`,
          status: p.status,
          loanIdLokal: null,
        }));
    }
    return peminjaman
      .filter((p) => p.siswaId === CURRENT_SISWA_ID && p.status === 'Dipinjam')
      .map((p) => {
        const f = getFasilitas(p.fasilitasId);
        return {
          key: `lokal-${p.id}`,
          backendId: null,
          nama: f?.nama ?? '-',
          icon: f?.icon ?? 'inventory_2',
          keperluan: p.keperluan,
          batasLabel: `Batas: ${p.batasKembali.slice(11, 16)} WIB`,
          loanIdLokal: p.id,
        };
      });
  }, [bePinjam, peminjaman, getFasilitas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return daftarFasilitas.filter((f) => {
      const matchCat = category === 'Semua' || f.kategori === category;
      const matchQuery = !q || f.nama.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [daftarFasilitas, query, category]);

  // Riwayat lengkap (semua status) dengan format DD-MM-YYYY HH:mm.
  const riwayat: (PinjamanView & { alasan?: string | null; bukti?: string | null })[] = useMemo(() => {
    if (bePinjam === null) return [];
    return [...bePinjam]
      .sort((a, b) => b.id - a.id)
      .map((p) => ({
        key: `riw-${p.id}`,
        backendId: p.id,
        nama: p.barang?.nama ?? '-',
        icon: p.barang?.icon ?? 'inventory_2',
        keperluan: p.catatan ?? '',
        batasLabel: `${formatTanggalJam(p.tanggalPinjam)} → ${formatTanggalJam(p.tanggalKembali)}`,
        status: p.status,
        loanIdLokal: null,
        alasan: p.alasan ?? null,
        bukti: p.bukti ?? null,
      }));
  }, [bePinjam]);

  const handleAjukan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedFasilitas || !keperluan.trim() || !alasan.trim() || saving) return;
    const fasilitasDipilih = pickedFasilitas;
    const mulai = new Date(tanggalPinjamInput);
    const kembali = new Date(tanggalKembaliInput);
    if (Number.isNaN(mulai.getTime()) || Number.isNaN(kembali.getTime())) {
      setDbError('Tanggal & waktu mulai / batas kembali tidak valid.');
      return;
    }
    if (kembali <= mulai) {
      setDbError('Batas kembali harus setelah tanggal mulai pinjam.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setSaving(true);
    setDbError('');
    setDbNotice('');
    // Stok adalah kebenaran backend: POST dulu (stok berkurang saat admin
    // APPROVE). Baris backend bawa id numerik; baris lokal dicocokkan nama.
    try {
      let barangId = fasilitasDipilih.backendId;
      if (barangId === null) {
        const daftar = await apiListBarang();
        const match = daftar.find(
          (b) => b.nama.toLowerCase() === fasilitasDipilih.nama.trim().toLowerCase(),
        );
        if (!match) {
          throw new Error(
            `Fasilitas "${fasilitasDipilih.nama}" belum ada di backend.`,
          );
        }
        barangId = match.id;
      }
      // Stok TIDAK berkurang di sini — baru berkurang saat admin APPROVE.
      await apiCreatePeminjaman({
        barangId,
        tanggalPinjam: mulai.toISOString(),
        tanggalKembali: kembali.toISOString(),
        catatan: keperluan.trim(),
        alasan: alasan.trim(),
        ...(bukti.trim() ? { bukti: bukti.trim() } : {}),
      });
      // Cache lokal hanya untuk baris lokal (baris backend tak ada di store).
      const asalLokal = fasilitas.find((f) => `lokal-${f.id}` === fasilitasDipilih.key);
      if (asalLokal) {
        ajukanPeminjaman({
          siswaId: CURRENT_SISWA_ID,
          fasilitasId: asalLokal.id,
          keperluan: keperluan.trim(),
          batasKembali: tanggalKembaliInput.length === 16 ? `${tanggalKembaliInput}:00` : tanggalKembaliInput,
        });
      }
      await muatBackend();
      setDbNotice(`Pengajuan "${fasilitasDipilih.nama}" tercatat di backend (menunggu persetujuan admin). Stok belum berkurang.`);
      setPickedFasilitas(null);
      setKeperluan('');
      setAlasan('');
      setBukti('');
    } catch (err) {
      setDbError(
        err instanceof Error ? err.message : 'Gagal menyimpan ke backend.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKembali = async (loan: PinjamanView) => {
    setDbError('');
    setDbNotice('');
    // Baris backend: kembalikan via backend (stok pulih, tercatat DIKEMBALIKAN).
    if (loan.backendId !== null) {
      try {
        await apiKembalikanMandiri(loan.backendId);
        await muatBackend();
        setDbNotice('Pengembalian tercatat di backend. Terima kasih!');
      } catch (err) {
        setDbError(
          err instanceof Error
            ? `Gagal masuk backend: ${err.message}`
            : 'Gagal masuk backend.',
        );
      }
      return;
    }
    // Fallback lokal (konfirmasi admin kemudian di backend).
    if (loan.loanIdLokal) kembalikanPeminjaman(loan.loanIdLokal);
    setDbNotice('Pengembalian tercatat. Admin mengonfirmasi di backend.');
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Peminjaman Fasilitas
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Pinjam ruangan, peralatan elektronik, dan fasilitas olahraga
            sekolah — stok tersedia diperbarui langsung ke bagian inventaris
            admin.
          </p>
        </div>
      </ScrollReveal>

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

      {myLoans.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section className="flex flex-col gap-3">
            {myLoans.map((loan) => {
              return (
                <GlassCard
                  key={loan.key}
                  className="flex flex-col gap-4 border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-inset ring-emerald-100">
                      <span className="material-symbols-outlined icon-fill text-[26px]">{loan.icon}</span>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">Sedang Dipinjam: {loan.nama}</span>
                      <span className="text-xs font-medium text-gray-500">{loan.keperluan}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-900 ring-1 ring-inset ring-emerald-100">
                      <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-600">schedule</span>
                      {loan.batasLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleKembali(loan)}
                      className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100"
                    >
                      Kembalikan
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </section>
        </ScrollReveal>
      )}

      {riwayat.length > 0 && (
        <ScrollReveal delay={0.07}>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Riwayat Pengajuan</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4 font-semibold">Fasilitas</th>
                    <th className="px-6 py-4 font-semibold">Mulai → Batas Kembali</th>
                    <th className="px-6 py-4 font-semibold">Alasan / Bukti</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r) => (
                    <tr key={r.key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{r.nama}</span>
                        {r.keperluan && (
                          <span className="block text-xs text-gray-500">{r.keperluan}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono tabular-nums text-xs text-gray-500">{r.batasLabel}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {r.alasan || '-'}
                        {r.bukti && (
                          <a href={r.bukti} target="_blank" rel="noreferrer" className="ml-2 font-semibold text-emerald-600 hover:text-emerald-700">
                            Lihat bukti
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">Format tanggal: DD-MM-YYYY HH:mm.</p>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari fasilitas…"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                  category === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <StaggerGroup key={`${category}-${query}`} as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => {
          const bermasalah = f.kondisi !== 'Baik';
          const habis = f.jumlahTersedia < 1;
          return (
            <GlassCard
              key={f.key}
              className="flex h-full flex-col items-center gap-4 p-6 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[32px]">{f.icon}</span>
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-gray-900">{f.nama}</h3>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className={`inline-flex w-max rounded-full px-3 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CATEGORY_CHIP[f.kategori]}`}>
                    {f.kategori}
                  </span>
                  {bermasalah && (
                    <span className={`inline-flex w-max rounded-full px-3 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${KONDISI_STYLE[f.kondisi]}`}>
                      {f.kondisi}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Tersedia: <span className="font-bold text-gray-900">{f.jumlahTersedia}</span> / {f.jumlahTotal}
              </p>
              <button
                type="button"
                disabled={habis || bermasalah}
                onClick={() => setPickedFasilitas(f)}
                className="mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {bermasalah ? f.kondisi : habis ? 'Stok Habis' : 'Ajukan Pinjaman'}
              </button>
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
            Tidak ada fasilitas yang cocok dengan pencarian.
          </div>
        )}
      </StaggerGroup>

      {pickedFasilitas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Ajukan Pinjaman: {pickedFasilitas.nama}
            </h2>
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleAjukan}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Keperluan</label>
                <textarea
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  rows={3}
                  required
                  placeholder="Contoh: Presentasi tugas Sejarah kelas X IPA 1"
                  className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Alasan Peminjaman</label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={3}
                  required
                  placeholder="Contoh: Untuk kegiatan ekstrakurikuler basket antar kelas, sudah izin pembina."
                  className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Bukti <span className="font-normal text-gray-400">(opsional — URL/dokumen pendukung)</span></label>
                <input
                  type="url"
                  value={bukti}
                  onChange={(e) => setBukti(e.target.value)}
                  placeholder="https://… (surat izin / proposal kegiatan)"
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tanggal &amp; Waktu Mulai Pinjam</label>
                <input
                  type="datetime-local"
                  value={tanggalPinjamInput}
                  onChange={(e) => setTanggalPinjamInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-xs text-gray-400">Bisa hari ini atau tanggal depan (pre-order).</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tanggal &amp; Waktu Batas Kembali</label>
                <input
                  type="datetime-local"
                  value={tanggalKembaliInput}
                  onChange={(e) => setTanggalKembaliInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPickedFasilitas(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                >
                  {saving ? 'Memproses...' : 'Konfirmasi Pinjam'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
