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

  const muatBackend = async () => {
    try {
      const [b, p] = await Promise.all([
        apiListBarang(),
        apiListPeminjaman('DIPINJAM'),
      ]);
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
        kondisi: (b.kondisi === 'BAIK' ? 'Baik' : 'Rusak') as KondisiFasilitas,
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

  const stats = useMemo(() => {
    const total = daftarBarang.reduce((sum, f) => sum + f.jumlahTotal, 0);
    const dipinjam = bePinjam !== null
      ? bePinjam.length
      : peminjaman.filter((p) => p.status === 'Dipinjam').length;
    const rusak = daftarBarang.filter((f) => f.kondisi === 'Rusak').length;
    const diperbaiki = daftarBarang.filter((f) => f.kondisi === 'Diperbaiki').length;
    return [
      { label: 'Total Unit', count: total, icon: 'inventory_2', chip: 'bg-blue-50 text-blue-600 ring-blue-100' },
      { label: 'Sedang Dipinjam', count: dipinjam, icon: 'front_hand', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
      { label: 'Rusak', count: rusak, icon: 'build', chip: 'bg-red-50 text-red-600 ring-red-100' },
      { label: 'Diperbaiki', count: diperbaiki, icon: 'handyman', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
    ];
  }, [daftarBarang, bePinjam, peminjaman]);

  interface PinjamanAktifView {
    key: string;
    barangNama: string;
    peminjam: string;
    detail: string;
  }

  const activeLoans: PinjamanAktifView[] = useMemo(() => {
    if (bePinjam !== null) {
      return bePinjam.map((p) => ({
        key: `be-${p.id}`,
        barangNama: p.barang?.nama ?? '-',
        peminjam: p.siswa?.user?.nama ?? '-',
        detail: `${p.catatan ?? ''} · Kembali: ${p.tanggalKembali.slice(0, 10)}`,
      }));
    }
    return peminjaman
      .filter((p) => p.status === 'Dipinjam')
      .map((p) => {
        const f = fasilitas.find((x) => x.id === p.fasilitasId);
        const s = getSiswa(p.siswaId);
        return {
          key: `lokal-${p.id}`,
          barangNama: f?.nama ?? '-',
          peminjam: s?.nama ?? '-',
          detail: `${p.keperluan} · Batas: ${p.batasKembali.slice(11, 16)} WIB`,
        };
      });
  }, [bePinjam, peminjaman, fasilitas, getSiswa]);

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

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {activeLoans.length > 0 && (
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
                    <p className="text-xs text-gray-500">{p.detail}</p>
                  </GlassCard>
                );
              })}
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
