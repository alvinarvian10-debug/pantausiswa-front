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

/** "2026-09-10 08:00" → "2026-09-11 15:00" (jam boleh kosong utk data lama). */
function labelPeriode(
  tglMulai: string,
  jamMulai: string | null,
  tglSelesai: string,
  jamSelesai: string | null,
): string {
  const mulai = `${tglMulai.slice(0, 10)}${jamMulai ? ` ${jamMulai}` : ''}`;
  const selesai = `${tglSelesai.slice(0, 10)}${jamSelesai ? ` ${jamSelesai}` : ''}`;
  return `${mulai} → ${selesai}`;
}

export default function PeminjamanPage() {
  const { fasilitas, peminjaman, getFasilitas, ajukanPeminjaman, kembalikanPeminjaman } = useAppData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Semua');
  const [pickedFasilitas, setPickedFasilitas] = useState<FasilitasView | null>(null);
  const [keperluan, setKeperluan] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().slice(0, 10));
  const [jamPinjam, setJamPinjam] = useState('08:00');
  const [jamKembali, setJamKembali] = useState('15:00');
  const [tanggalKembali, setTanggalKembali] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  });
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sumber kebenaran: backend bila terjangkau (stok + riwayat), lokal bila tidak.
  const [beBarang, setBeBarang] = useState<BackendBarang[] | null>(null);
  const [bePinjam, setBePinjam] = useState<BackendPeminjaman[] | null>(null);

  const muatBackend = async () => {
    try {
      const [b, p] = await Promise.all([apiListBarang(), apiMyPeminjaman()]);
      setBeBarang(b.length > 0 ? b : null);
      setBePinjam(p.data.length > 0 ? p.data : null);
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
        kondisi: b.kondisi === 'BAIK'
          ? 'Baik'
          : b.kondisi === 'RUSAK_RINGAN'
            ? 'Diperbaiki'
            : 'Rusak',
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
          batasLabel: labelPeriode(p.tanggalPinjam, p.jamPinjam, p.tanggalKembali, p.jamKembali),
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
          batasLabel: labelPeriode(p.tanggalPinjam, null, p.batasKembali, null),
          loanIdLokal: p.id,
        };
      });
  }, [bePinjam, peminjaman, getFasilitas]);

  const pendingLoans: PinjamanView[] = useMemo(() => {
    if (bePinjam !== null) {
      return bePinjam
        .filter((p) => p.status === 'MENUNGGU')
        .map((p) => ({
          key: `be-pending-${p.id}`,
          backendId: p.id,
          nama: p.barang?.nama ?? '-',
          icon: p.barang?.icon ?? 'inventory_2',
          keperluan: p.catatan ?? '',
          batasLabel: labelPeriode(p.tanggalPinjam, p.jamPinjam, p.tanggalKembali, p.jamKembali),
          loanIdLokal: null,
        }));
    }
    return peminjaman
      .filter((p) => p.siswaId === CURRENT_SISWA_ID && p.status === 'Diajukan')
      .map((p) => {
        const f = getFasilitas(p.fasilitasId);
        return {
          key: `lokal-pending-${p.id}`,
          backendId: null,
          nama: f?.nama ?? '-',
          icon: f?.icon ?? 'inventory_2',
          keperluan: p.keperluan,
          batasLabel: labelPeriode(p.tanggalPinjam, null, p.batasKembali, null),
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

  const handleAjukan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedFasilitas || !keperluan.trim() || saving) return;
    const fasilitasDipilih = pickedFasilitas;
    setSaving(true);
    setDbError('');
    setDbNotice('');
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
      await apiCreatePeminjaman({
        barangId,
        tanggalKembali,
        jamPinjam,
        jamKembali,
        catatan: `[${tanggalPinjam} ${jamPinjam} s/d ${tanggalKembali} ${jamKembali}] ${keperluan.trim()}`,
      });
      const asalLokal = fasilitas.find((f) => `lokal-${f.id}` === fasilitasDipilih.key);
      if (asalLokal) {
        ajukanPeminjaman({
          siswaId: CURRENT_SISWA_ID,
          fasilitasId: asalLokal.id,
          keperluan: keperluan.trim(),
          batasKembali: `${tanggalKembali}T23:59:59`,
        });
      }
      await muatBackend();
      setDbNotice(`Pengajuan "${fasilitasDipilih.nama}" tercatat (menunggu persetujuan admin). Stok akan berkurang setelah disetujui.`);
      setPickedFasilitas(null);
      setKeperluan('');
      setTanggalPinjam(new Date().toISOString().slice(0, 10));
      setJamPinjam('08:00');
      setJamKembali('15:00');
      const next = new Date(); next.setDate(next.getDate() + 1);
      setTanggalKembali(next.toISOString().slice(0, 10));
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
            Pinjam ruangan, peralatan elektronik, dan fasilitas olahraga sekolah.
            Stok hanya berkurang setelah admin menyetujui permohonan Anda.
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

      {pendingLoans.length > 0 && (
        <ScrollReveal delay={0.04}>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-500">
              Menunggu Persetujuan ({pendingLoans.length})
            </h2>
            {pendingLoans.map((loan) => (
              <GlassCard
                key={loan.key}
                className="flex flex-col gap-4 border border-amber-200 bg-amber-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-inset ring-amber-100">
                    <span className="material-symbols-outlined icon-fill text-[26px]">{loan.icon}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{loan.nama}</span>
                    <span className="text-xs font-medium text-gray-500">{loan.keperluan}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <span className="material-symbols-outlined icon-fill text-[18px] text-amber-500">hourglass_top</span>
                    {loan.batasLabel}
                  </span>
                  <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
                    Menunggu
                  </span>
                </div>
              </GlassCard>
            ))}
          </section>
        </ScrollReveal>
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
                      <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-600">date_range</span>
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
            <p className="mt-1 text-sm text-gray-500">
              Stok barang tidak berkurang saat diajukan. Stok hanya berkurang setelah admin menyetujui.
            </p>
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
                <label className="text-sm font-medium text-gray-700">Tanggal &amp; Jam Mulai Pinjam</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tanggalPinjam}
                    onChange={(e) => setTanggalPinjam(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                    className="flex-1 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="time"
                    value={jamPinjam}
                    onChange={(e) => setJamPinjam(e.target.value)}
                    required
                    className="w-28 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <p className="text-xs text-gray-400">Mulai kapan (tanggal &amp; jam) barang ini Anda butuhkan.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Batas Tanggal &amp; Jam Pengembalian</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tanggalKembali}
                    onChange={(e) => setTanggalKembali(e.target.value)}
                    min={tanggalPinjam}
                    required
                    className="flex-1 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="time"
                    value={jamKembali}
                    onChange={(e) => setJamKembali(e.target.value)}
                    required
                    className="w-28 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <p className="text-xs text-gray-400">Kapan barang harus dikembalikan (tanggal &amp; jam). Lewat batas = keterlambatan.</p>
              </div>
              <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700 ring-1 ring-inset ring-blue-100">
                <span className="font-semibold">Periode pinjam:</span> {tanggalPinjam} {jamPinjam} &rarr; {tanggalKembali} {jamKembali}
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
                  disabled={saving || !keperluan.trim() || tanggalKembali < tanggalPinjam || (tanggalKembali === tanggalPinjam && jamKembali <= jamPinjam)}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                >
                  {saving ? 'Memproses...' : 'Ajukan Pinjaman'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
