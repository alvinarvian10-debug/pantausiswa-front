'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import { apiCreateAduan, apiMyAduan, toBackendKategori, type BackendAduan } from '../../../../lib/api';
import { CURRENT_SISWA_ID, JenisAduan, useAppData } from '../../../../lib/store';

const kapital = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const STATUS_BE_KE_DEPAN: Record<string, string> = {
  BARU: 'Baru',
  DIPROSES: 'Proses',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

const STATUS_STYLE: Record<string, string> = {
  Baru: 'bg-blue-50 text-blue-700 ring-blue-100',
  Proses: 'bg-amber-50 text-amber-700 ring-amber-100',
  Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-600 ring-red-100',
};

const FILTERS = ['Semua', 'Baru', 'Proses', 'Selesai'] as const;

export default function AduanPage() {
  const { aduan, fasilitas, buatAduan } = useAppData();
  const [openForm, setOpenForm] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    jenis: 'Fasilitas' as JenisAduan,
    fasilitasId: fasilitas[0]?.id ?? '',
    judul: '',
    deskripsi: '',
    isAnonim: false,
    lampiranNama: null as string | null,
  });

  const myAduanLokal = useMemo(
    () => aduan.filter((a) => a.siswaId === CURRENT_SISWA_ID),
    [aduan],
  );
  const [dbError, setDbError] = useState('');

  // Sumber kebenaran: backend bila terjangkau, lokal bila tidak.
  const [beAduan, setBeAduan] = useState<BackendAduan[] | null>(null);

  const muatBackend = async () => {
    try {
      const res = await apiMyAduan();
      setBeAduan(res.data);
    } catch {
      setBeAduan(null);
    }
  };

  useEffect(() => {
    muatBackend();
  }, []);

  const myAduan = useMemo(
    () =>
      beAduan !== null
        ?       beAduan.map((a) => ({
            id: String(a.id),
            jenis: (a.kategori === 'FASILITAS' ? 'Fasilitas' : 'Keluhan') as JenisAduan,
            judul: a.judul,
            deskripsi: a.deskripsi,
            isAnonim: a.isAnonim,
            tanggal: (a.createdAt ?? '').slice(0, 10),
            status: STATUS_BE_KE_DEPAN[a.status] ?? kapital(a.status),
            tanggapan: a.tanggapan,
          }))
        : myAduanLokal,
    [beAduan, myAduanLokal],
  );

  const stats = useMemo(() => {
    const total = myAduan.length;
    const proses = myAduan.filter((a) => a.status === 'Proses' || a.status === 'Baru').length;
    const selesai = myAduan.filter((a) => a.status === 'Selesai').length;
    return [
      { label: 'Total Aduan', count: total, chip: 'bg-blue-50 text-blue-600 ring-blue-100', icon: 'forum' },
      { label: 'Dalam Proses', count: proses, chip: 'bg-amber-50 text-amber-600 ring-amber-100', icon: 'hourglass_top' },
      { label: 'Selesai Ditangani', count: selesai, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: 'task_alt' },
    ];
  }, [myAduan]);

  const visible = useMemo(() => {
    if (filter === 'Semua') return myAduan;
    return myAduan.filter((a) => a.status === filter);
  }, [myAduan, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !form.judul.trim() || !form.deskripsi.trim()) return;
    setSubmitting(true);
    setDbError('');
    const payload = {
      siswaId: CURRENT_SISWA_ID,
      jenis: form.jenis,
      fasilitasId: form.jenis === 'Fasilitas' ? form.fasilitasId : null,
      judul: form.judul.trim(),
      deskripsi: form.deskripsi.trim(),
      lampiranNama: form.lampiranNama,
      isAnonim: form.isAnonim,
    };
    // 1) Simpan ke backend NestJS via POST /aduan (agar masuk database).
    //    Pakai id baris backend sebagai id lokal supaya PATCH admin cocok.
    let dbId: string | undefined;
    try {
      const saved = await apiCreateAduan({
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        kategori: toBackendKategori(form.jenis),
        ...(form.lampiranNama ? { lampiranUrl: form.lampiranNama } : {}),
        ...(form.isAnonim ? { isAnonim: true } : {}),
      });
      if (saved?.id != null) dbId = String(saved.id);
    } catch (err) {
      // Jangan blokir UX: tetap simpan lokal, tapi beri tahu user backend gagal.
      setDbError(
        err instanceof Error
          ? `Tersimpan lokal, tapi gagal masuk backend: ${err.message} (pastikan backend + MySQL jalan).`
          : 'Tersimpan lokal, tapi gagal masuk backend.',
      );
    }
    // 2) Tetap simpan ke store lokal agar UI langsung update (optimistic).
    buatAduan(dbId ? { ...payload, id: dbId } : payload);
    await muatBackend();
    setSubmitting(false);
    setOpenForm(false);
    setSuccess(true);
    setForm({ jenis: 'Fasilitas', fasilitasId: fasilitas[0]?.id ?? '', judul: '', deskripsi: '', isAnonim: false, lampiranNama: null });
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Aduan</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Laporkan fasilitas yang rusak atau sampaikan keluh kesahmu — kedua
            jenis aduan langsung masuk ke bagian admin.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
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
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOpenForm((v) => !v)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] lg:w-auto"
            >
              <span className="material-symbols-outlined icon-fill text-[20px]">add_comment</span>
              {openForm ? 'Tutup Form' : 'Buat Aduan Baru'}
            </button>
          </div>
        </section>
      </ScrollReveal>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          Aduanmu berhasil dikirim dan sedang ditinjau admin.
        </div>
      )}

      {dbError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">error</span>
          {dbError}
        </div>
      )}

      {openForm && (
        <GlassCard className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">Buat Aduan Baru</h2>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {(['Fasilitas', 'Keluhan'] as JenisAduan[]).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, jenis: j }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all ${
                    form.jenis === j
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 bg-white text-gray-500 hover:border-emerald-200'
                  }`}
                >
                  <span className="material-symbols-outlined icon-fill text-[22px]">
                    {j === 'Fasilitas' ? 'build' : 'sentiment_dissatisfied'}
                  </span>
                  {j === 'Fasilitas' ? 'Fasilitas Rusak' : 'Keluh Kesah'}
                </button>
              ))}
            </div>

            {form.jenis === 'Fasilitas' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fasilitas Terkait</label>
                <select
                  value={form.fasilitasId}
                  onChange={(e) => setForm((f) => ({ ...f, fasilitasId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {fasilitas.map((f) => (
                    <option key={f.id} value={f.id}>{f.nama}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Judul Aduan</label>
              <input
                type="text"
                value={form.judul}
                onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                placeholder={form.jenis === 'Fasilitas' ? 'Contoh: Kipas angin ruang kelas mati' : 'Contoh: Keluhan tentang jadwal ujian'}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Deskripsi Detail</label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                rows={4}
                placeholder="Jelaskan kendala atau masalah yang ingin kamu laporkan secara lengkap…"
                className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isAnonim}
                onChange={(e) => setForm((f) => ({ ...f, isAnonim: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Kirim secara Anonim — identitasmu tidak akan terlihat oleh publik
              </span>
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition-colors hover:border-emerald-300">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setForm((f) => ({ ...f, lampiranNama: e.target.files?.[0]?.name ?? null }))}
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">add_a_photo</span>
              </span>
              <p className="text-sm font-medium text-gray-600">{form.lampiranNama ?? 'Unggah foto bukti jika ada'}</p>
              <p className="text-xs text-gray-400">Tarik &amp; lepas berkas di sini, atau klik untuk memilih</p>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-emerald-500/70"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined icon-fill animate-spin text-[18px]">progress_activity</span>
                  Mengirimkan aduan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined icon-fill text-[18px]">send</span>
                  Kirim Aduan Sekarang
                </>
              )}
            </button>
          </form>
        </GlassCard>
      )}

      <section className="flex flex-col">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {visible.map((a) => (
            <GlassCard key={a.id} className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-100">
                  {a.jenis === 'Fasilitas' ? 'Fasilitas Rusak' : 'Keluh Kesah'}
                </span>
                {a.isAnonim && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span className="material-symbols-outlined icon-fill text-[14px]">visibility_off</span>
                    Anonim
                  </span>
                )}
                <span className="text-xs text-gray-400">{a.tanggal}</span>
                <span className={`ml-auto inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{a.judul}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{a.deskripsi}</p>
              {a.tanggapan && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-relaxed text-emerald-800">
                  <span className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="material-symbols-outlined icon-fill text-[18px]">forum</span>
                    Tanggapan Pihak Sekolah:
                  </span>
                  {a.tanggapan}
                </div>
              )}
            </GlassCard>
          ))}
          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
              Tidak ada aduan pada filter ini.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
