'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  apiCreateBarang,
  apiListBarang,
  apiListPeminjaman,
  apiUpdateBarang,
  apiReviewPeminjaman,
  apiAdminKembalikan,
  type BackendBarang,
  type BackendPeminjaman,
} from '../../../../lib/api';
import { KategoriFasilitas, KondisiFasilitas, useAppData } from '../../../../lib/store';

const KONDISI_STYLE: Record<KondisiFasilitas, string> = {
  Baik: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Rusak: 'bg-red-50 text-red-700 ring-red-100',
  Diperbaiki: 'bg-amber-50 text-amber-700 ring-amber-100',
};

const ICON_OPTIONS = ['inventory_2', 'videocam', 'computer', 'sports_basketball', 'meeting_room', 'speaker', 'sports_volleyball', 'mic', 'ac_unit', 'print'];

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

const RIWAYAT_CHIP: Record<string, string> = {
  DIKEMBALIKAN: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  DITOLAK: 'bg-red-50 text-red-600 ring-red-100',
  DIBATALKAN: 'bg-slate-100 text-slate-600 ring-slate-200',
  Dikembalikan: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-600 ring-red-100',
};

const RIWAYAT_LABEL: Record<string, string> = {
  DIKEMBALIKAN: 'Dikembalikan',
  DITOLAK: 'Ditolak',
  DIBATALKAN: 'Dibatalkan',
  Dikembalikan: 'Dikembalikan',
  Ditolak: 'Ditolak',
};

/** Chip status read-only untuk item histori (tanpa aksi). */
function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex w-max rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${RIWAYAT_CHIP[status] ?? RIWAYAT_CHIP.DIBATALKAN}`}>
      {RIWAYAT_LABEL[status] ?? status}
    </span>
  );
}

export default function InventarisPage() {
  const { fasilitas, peminjaman, tambahFasilitas, updateKondisiFasilitas, getSiswa } = useAppData();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    nama: '', kategori: 'Elektronik' as KategoriFasilitas, icon: 'inventory_2', jumlahTotal: 1,
  });
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sumber kebenaran: backend bila terjangkau, lokal bila tidak.
  const [beBarang, setBeBarang] = useState<BackendBarang[] | null>(null);
  const [bePinjam, setBePinjam] = useState<BackendPeminjaman[] | null>(null);
  const [beMenunggu, setBeMenunggu] = useState<BackendPeminjaman[] | null>(null);
  const [beRiwayat, setBeRiwayat] = useState<BackendPeminjaman[] | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');

  const muatBackend = async () => {
    try {
      const [b, pDipinjam, pMenunggu, pRiwayat] = await Promise.all([
        apiListBarang(),
        apiListPeminjaman('DIPINJAM'),
        apiListPeminjaman('MENUNGGU'),
        apiListPeminjaman(undefined, 'history'),
      ]);
      setBeBarang(b.length > 0 ? b : null);
      setBePinjam(pDipinjam.data.length > 0 ? pDipinjam.data : null);
      setBeMenunggu(pMenunggu.data.length > 0 ? pMenunggu.data : null);
      // Array kosong = riwayat valid yang masih kosong, bukan offline.
      setBeRiwayat(pRiwayat.data);
    } catch {
      setBeBarang(null);
      setBePinjam(null);
      setBeMenunggu(null);
      setBeRiwayat(null);
    }
  };

  useEffect(() => {
    muatBackend();
  }, []);

  interface BarangView {
    key: string;
    backendId: number | null;
    idLokal: string | null;
    nama: string;
    kategori: string;
    icon: string;
    jumlahTotal: number;
    jumlahTersedia: number;
    kondisi: KondisiFasilitas;
  }

  const daftarBarang: BarangView[] = useMemo(() => {
    if (beBarang !== null) {
      return beBarang.map((b) => ({
        key: `be-${b.id}`,
        backendId: b.id,
        idLokal: null,
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
      idLokal: f.id,
      nama: f.nama,
      kategori: f.kategori,
      icon: f.icon,
      jumlahTotal: f.jumlahTotal,
      jumlahTersedia: f.jumlahTersedia,
      kondisi: f.kondisi,
    }));
  }, [beBarang, fasilitas]);

  // PATCH kondisi ke backend (Baik→BAIK, Rusak→RUSAK_BERAT,
  // Diperbaiki→RUSAK_RINGAN). Id lokal non-numerik dicocokkan via nama.
  const syncKondisiKeDB = async (fasilitasId: string | number, nama: string, kondisi: KondisiFasilitas) => {
    const backendKondisi =
      kondisi === 'Rusak' ? 'RUSAK_BERAT' : kondisi === 'Diperbaiki' ? 'RUSAK_RINGAN' : 'BAIK';
    let numericId = Number(fasilitasId);
    if (!Number.isInteger(numericId)) {
      const daftar = await apiListBarang();
      const match = daftar.find(
        (b) => b.nama.toLowerCase() === nama.trim().toLowerCase(),
      );
      if (!match) {
        throw new Error('Fasilitas ini belum ada di backend. Tambahkan ulang via form.');
      }
      numericId = match.id;
    }
    await apiUpdateBarang(numericId, { kondisi: backendKondisi });
  };

  const handleKondisi = async (view: BarangView, kondisi: KondisiFasilitas) => {
    if (view.idLokal) updateKondisiFasilitas(view.idLokal, kondisi);
    setDbError('');
    setDbNotice('');
    try {
      await syncKondisiKeDB(view.backendId ?? view.key, view.nama, kondisi);
      await muatBackend();
      setDbNotice(`Kondisi "${view.nama}" → ${kondisi}, tersimpan di backend.`);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Lokal berubah, tapi gagal masuk backend: ${err.message}`
          : 'Lokal berubah, tapi gagal masuk backend.',
      );
    }
  };

  const handleReviewPeminjaman = async (id: number, aksi: 'APPROVE' | 'REJECT') => {
    setDbError('');
    setDbNotice('');
    setReviewingId(id);
    try {
      await apiReviewPeminjaman(id, aksi);
      await muatBackend();
      setDbNotice(aksi === 'APPROVE' ? 'Peminjaman disetujui. Stok barang berkurang.' : 'Peminjaman ditolak.');
    } catch (err) {
      setDbError(
        err instanceof Error ? `Gagal: ${err.message}` : 'Gagal memproses peminjaman.',
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleKembalikanAdmin = async (id: number) => {
    setDbError('');
    setDbNotice('');
    setReviewingId(id);
    try {
      await apiAdminKembalikan(id);
      await muatBackend();
      setDbNotice('Barang berhasil dikembalikan. Stok bertambah.');
    } catch (err) {
      setDbError(
        err instanceof Error ? `Gagal: ${err.message}` : 'Gagal mengembalikan barang.',
      );
    } finally {
      setReviewingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = daftarBarang.reduce((sum, f) => sum + f.jumlahTotal, 0);
    const dipinjam = bePinjam !== null
      ? bePinjam.length
      : peminjaman.filter((p) => p.status === 'Dipinjam').length;
    const menunggu = beMenunggu !== null ? beMenunggu.length : 0;
    const rusak = daftarBarang.filter((f) => f.kondisi === 'Rusak').length;
    const diperbaiki = daftarBarang.filter((f) => f.kondisi === 'Diperbaiki').length;
    return [
      { label: 'Total Unit', count: total, icon: 'inventory_2', chip: 'bg-blue-50 text-blue-600 ring-blue-100' },
      { label: 'Sedang Dipinjam', count: dipinjam, icon: 'front_hand', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
      { label: 'Menunggu', count: menunggu, icon: 'pending', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
      { label: 'Rusak', count: rusak, icon: 'build', chip: 'bg-red-50 text-red-600 ring-red-100' },
      { label: 'Diperbaiki', count: diperbaiki, icon: 'handyman', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
    ];
  }, [daftarBarang, bePinjam, beMenunggu, peminjaman]);

  interface PinjamanAktifView {
    key: string;
    backendId: number | null;
    barangNama: string;
    peminjam: string;
    detail: string;
  }

  const activeLoans: PinjamanAktifView[] = useMemo(() => {
    if (bePinjam !== null) {
      return bePinjam.map((p) => ({
        key: `be-${p.id}`,
        backendId: p.id,
        barangNama: p.barang?.nama ?? '-',
        peminjam: p.siswa?.user?.nama ?? '-',
        detail: `${p.catatan ?? ''} · ${labelPeriode(p.tanggalPinjam, p.jamPinjam, p.tanggalKembali, p.jamKembali)}`,
      }));
    }
    return peminjaman
      .filter((p) => p.status === 'Dipinjam')
      .map((p) => {
        const f = fasilitas.find((x) => x.id === p.fasilitasId);
        const s = getSiswa(p.siswaId);
        return {
          key: `lokal-${p.id}`,
          backendId: null,
          barangNama: f?.nama ?? '-',
          peminjam: s?.nama ?? '-',
          detail: `${p.keperluan} · ${p.tanggalPinjam} → ${p.batasKembali.slice(0, 10)}`,
        };
      });
  }, [bePinjam, peminjaman, fasilitas, getSiswa]);

  interface RiwayatView {
    key: string;
    barangNama: string;
    peminjam: string;
    detail: string;
    status: string;
  }

  /** Transaksi selesai (DIKEMBALIKAN/DITOLAK) — read-only, tanpa aksi. */
  const historyLoans: RiwayatView[] = useMemo(() => {
    if (beRiwayat !== null) {
      return beRiwayat.map((p) => ({
        key: `be-history-${p.id}`,
        barangNama: p.barang?.nama ?? '-',
        peminjam: p.siswa?.user?.nama ?? '-',
        detail: `${p.catatan ?? ''} · ${labelPeriode(p.tanggalPinjam, p.jamPinjam, p.tanggalKembali, p.jamKembali)}`,
        status: p.status,
      }));
    }
    return peminjaman
      .filter((p) => p.status === 'Dikembalikan' || p.status === 'Ditolak')
      .map((p) => {
        const f = fasilitas.find((x) => x.id === p.fasilitasId);
        const s = getSiswa(p.siswaId);
        return {
          key: `lokal-history-${p.id}`,
          barangNama: f?.nama ?? '-',
          peminjam: s?.nama ?? '-',
          detail: `${p.keperluan} · ${p.tanggalPinjam} → ${p.batasKembali.slice(0, 10)}`,
          status: p.status,
        };
      });
  }, [beRiwayat, peminjaman, fasilitas, getSiswa]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || form.jumlahTotal < 1 || saving) return;
    setSaving(true);
    setDbError('');
    setDbNotice('');
    const payload = {
      nama: form.nama.trim(),
      kategori: form.kategori,
      icon: form.icon,
      jumlahTotal: form.jumlahTotal,
      jumlahTersedia: form.jumlahTotal,
      kondisi: 'Baik' as KondisiFasilitas,
    };
    try {
      const saved = await apiCreateBarang({
        nama: payload.nama,
        kode: `INV-${Date.now().toString(36).toUpperCase()}`,
        kategori: payload.kategori,
        jumlahTotal: payload.jumlahTotal,
        icon: payload.icon,
      });
      tambahFasilitas({ ...payload, ...(saved?.id != null ? { id: String(saved.id) } : {}) });
      await muatBackend();
      setDbNotice(`Fasilitas "${payload.nama}" tersimpan di backend.`);
      setForm({ nama: '', kategori: 'Elektronik', icon: 'inventory_2', jumlahTotal: 1 });
      setOpenForm(false);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Gagal masuk backend: ${err.message}`
          : 'Gagal masuk backend.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Inventaris Fasilitas</h1>
            <p className="text-sm leading-relaxed text-gray-500">
              Stok diperbarui otomatis setiap kali siswa meminjam atau mengembalikan fasilitas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <span className="material-symbols-outlined icon-fill text-[20px]">add</span>
            {openForm ? 'Tutup Form' : 'Tambah Fasilitas'}
          </button>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex items-center gap-4 p-6">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${s.chip}`}>
              <span className="material-symbols-outlined icon-fill text-[24px]">{s.icon}</span>
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gray-900">{s.count}</span>
              <span className="text-sm font-medium text-gray-500">{s.label}</span>
            </div>
          </GlassCard>
        ))}
      </StaggerGroup>

      {openForm && (
        <GlassCard className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">Tambah Fasilitas Baru</h2>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleAdd}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nama Fasilitas</label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Contoh: Kamera DSLR"
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value as KategoriFasilitas }))}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option>Ruangan</option>
                <option>Elektronik</option>
                <option>Olahraga</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Jumlah Unit</label>
              <input
                type="number"
                min={1}
                value={form.jumlahTotal}
                onChange={(e) => setForm((f) => ({ ...f, jumlahTotal: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Ikon</label>
              <select
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
            >
              {saving ? 'Menyimpan...' : 'Simpan Fasilitas'}
            </button>
          </form>
        </GlassCard>
      )}

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

      <div className="flex gap-6 border-b border-slate-200" role="tablist" aria-label="Peminjaman aktif dan riwayat">
        {(['aktif', 'riwayat'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px pb-3 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'aktif' ? 'Peminjaman Aktif' : 'Riwayat'}
          </button>
        ))}
      </div>

      {activeTab === 'aktif' && activeLoans.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Sedang Dipinjam</h2>
            <div className="flex flex-col gap-3">
              {activeLoans.map((p) => {
                return (
                  <GlassCard key={p.key} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {p.barangNama} — dipinjam oleh <span className="font-semibold">{p.peminjam}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-500">{p.detail}</p>
                      {p.backendId !== null && (
                        <button
                          type="button"
                          disabled={reviewingId === p.backendId}
                          onClick={() => handleKembalikanAdmin(p.backendId!)}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {reviewingId === p.backendId ? 'Proses...' : 'Tandai Dikembalikan'}
                        </button>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        </ScrollReveal>
      )}

      {activeTab === 'aktif' && beMenunggu !== null && beMenunggu.length > 0 && (
        <ScrollReveal delay={0.08}>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-500">
              Permohonan Menunggu Persetujuan ({beMenunggu.length})
            </h2>
            <div className="flex flex-col gap-3">
              {beMenunggu.map((p) => (
                <GlassCard
                  key={`mw-${p.id}`}
                  className="flex flex-col gap-3 border border-amber-200 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.barang?.nama ?? '-'} — {p.siswa?.user?.nama ?? 'Siswa'}
                      {p.siswa?.kelas?.nama ? ` (${p.siswa.kelas.nama})` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.catatan ?? '-'}
                    </p>
                    <p className="text-xs font-medium text-amber-600">
                      Periode: {labelPeriode(p.tanggalPinjam, p.jamPinjam, p.tanggalKembali, p.jamKembali)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={reviewingId === p.id}
                      onClick={() => handleReviewPeminjaman(p.id, 'APPROVE')}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {reviewingId === p.id ? 'Proses...' : 'Setujui'}
                    </button>
                    <button
                      type="button"
                      disabled={reviewingId === p.id}
                      onClick={() => handleReviewPeminjaman(p.id, 'REJECT')}
                      className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {activeTab === 'riwayat' && (
        <ScrollReveal delay={0.05}>
          <section role="tabpanel" aria-label="Riwayat peminjaman">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Riwayat Peminjaman ({historyLoans.length})
            </h2>
            <div className="flex flex-col gap-3">
              {historyLoans.map((p) => (
                <GlassCard key={p.key} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {p.barangNama} — dipinjam oleh <span className="font-semibold">{p.peminjam}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500">{p.detail}</p>
                    <StatusChip status={p.status} />
                  </div>
                </GlassCard>
              ))}
              {historyLoans.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
                  Belum ada riwayat peminjaman yang selesai.
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Fasilitas</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Stok</th>
                <th className="px-6 py-4 font-semibold">Kondisi</th>
                <th className="px-6 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftarBarang.map((f) => (
                <tr key={f.key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                        <span className="material-symbols-outlined icon-fill text-[18px]">{f.icon}</span>
                      </span>
                      <span className="font-medium text-gray-900">{f.nama}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{f.kategori}</td>
                  <td className="px-6 py-4 text-gray-500">{f.jumlahTersedia} / {f.jumlahTotal}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${KONDISI_STYLE[f.kondisi]}`}>
                      {f.kondisi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={f.kondisi}
                      onChange={(e) => handleKondisi(f, e.target.value as KondisiFasilitas)}
                      className="rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-emerald-300"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Rusak">Tandai Rusak</option>
                      <option value="Diperbaiki">Sedang Diperbaiki</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </main>
  );
}
