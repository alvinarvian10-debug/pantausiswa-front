'use client';

import { useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
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
  const [pickedFasilitas, setPickedFasilitas] = useState<Fasilitas | null>(null);
  const [keperluan, setKeperluan] = useState('');
  const [jamKembali, setJamKembali] = useState('16:00');

  const myLoans = useMemo(
    () => peminjaman.filter((p) => p.siswaId === CURRENT_SISWA_ID && p.status === 'Dipinjam'),
    [peminjaman],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fasilitas.filter((f) => {
      const matchCat = category === 'Semua' || f.kategori === category;
      const matchQuery = !q || f.nama.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [fasilitas, query, category]);

  const handleAjukan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedFasilitas || !keperluan.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    ajukanPeminjaman({
      siswaId: CURRENT_SISWA_ID,
      fasilitasId: pickedFasilitas.id,
      keperluan: keperluan.trim(),
      batasKembali: `${today}T${jamKembali}:00`,
    });
    setPickedFasilitas(null);
    setKeperluan('');
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

      {myLoans.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section className="flex flex-col gap-3">
            {myLoans.map((loan) => {
              const f = getFasilitas(loan.fasilitasId);
              return (
                <GlassCard
                  key={loan.id}
                  className="flex flex-col gap-4 border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-inset ring-emerald-100">
                      <span className="material-symbols-outlined icon-fill text-[26px]">{f?.icon ?? 'inventory_2'}</span>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">Sedang Dipinjam: {f?.nama ?? '-'}</span>
                      <span className="text-xs font-medium text-gray-500">{loan.keperluan}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-900 ring-1 ring-inset ring-emerald-100">
                      <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-600">schedule</span>
                      Batas: {loan.batasKembali.slice(11, 16)} WIB
                    </span>
                    <button
                      type="button"
                      onClick={() => kembalikanPeminjaman(loan.id)}
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

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => {
          const bermasalah = f.kondisi !== 'Baik';
          const habis = f.jumlahTersedia < 1;
          return (
            <GlassCard
              key={f.id}
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
          <GlassCard className="w-full max-w-md p-6">
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
                <label className="text-sm font-medium text-gray-700">Batas Waktu Kembali</label>
                <input
                  type="time"
                  value={jamKembali}
                  onChange={(e) => setJamKembali(e.target.value)}
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
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Konfirmasi Pinjam
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
