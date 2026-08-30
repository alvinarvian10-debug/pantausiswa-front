'use client';

import { useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_SISWA_ID, JenisIzin, useAppData } from '../../../../lib/store';

const STATUS_BADGE: Record<string, string> = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-blue-100 text-blue-700',
  Alpa: 'bg-red-100 text-red-700',
};

const IZIN_STATUS_STYLE: Record<string, string> = {
  Menunggu: 'bg-amber-50 text-amber-700 ring-amber-100',
  Disetujui: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-700 ring-red-100',
};

export default function PresensiPage() {
  const { presensi, izin, getSiswa, checkIn, ajukanIzin } = useAppData();
  const [query, setQuery] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    jenis: 'Izin' as JenisIzin,
    tanggalMulai: new Date().toISOString().slice(0, 10),
    tanggalSelesai: new Date().toISOString().slice(0, 10),
    alasan: '',
    lampiranNama: null as string | null,
  });

  const me = getSiswa(CURRENT_SISWA_ID);
  const today = new Date().toISOString().slice(0, 10);

  const myPresensi = useMemo(
    () => presensi.filter((p) => p.siswaId === CURRENT_SISWA_ID),
    [presensi],
  );
  const myIzin = useMemo(
    () => izin.filter((i) => i.siswaId === CURRENT_SISWA_ID),
    [izin],
  );
  const alreadyCheckedIn = myPresensi.some((p) => p.tanggal === today);

  const kpi = useMemo(() => {
    const hadir = myPresensi.filter((p) => p.status === 'Hadir').length;
    const sakit = myPresensi.filter((p) => p.status === 'Sakit').length;
    const izinCount = myPresensi.filter((p) => p.status === 'Izin').length;
    const alpa = myPresensi.filter((p) => p.status === 'Alpa').length;
    return [
      { icon: 'person_check', count: hadir, label: 'Hadir', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
      { icon: 'sick', count: sakit, label: 'Sakit', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
      { icon: 'description', count: izinCount, label: 'Izin', chip: 'bg-blue-50 text-blue-600 ring-blue-100' },
      { icon: 'cancel', count: alpa, label: 'Tanpa Keterangan', chip: 'bg-red-50 text-red-600 ring-red-100' },
    ];
  }, [myPresensi]);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return myPresensi;
    return myPresensi.filter(
      (r) =>
        r.tanggal.includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.keterangan.toLowerCase().includes(q),
    );
  }, [myPresensi, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !form.alasan.trim() || !me) return;
    setSubmitting(true);
    setTimeout(() => {
      ajukanIzin({
        siswaId: me.id,
        kelasId: me.kelasId,
        jenis: form.jenis,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        alasan: form.alasan.trim(),
        lampiranNama: form.lampiranNama,
      });
      setSubmitting(false);
      setOpenForm(false);
      setSuccess(true);
      setForm({
        jenis: 'Izin',
        tanggalMulai: today,
        tanggalSelesai: today,
        alasan: '',
        lampiranNama: null,
      });
      setTimeout(() => setSuccess(false), 4000);
    }, 700);
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Presensi &amp; Izin
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Lakukan check-in harian, ajukan izin/sakit/dispensasi, dan pantau
            riwayat kehadiranmu. Pengajuan otomatis diteruskan ke wali kelas
            untuk disetujui.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup
        as="div"
        aria-label="Ringkasan kehadiran"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpi.map((k) => (
          <GlassCard key={k.label} className="flex items-center gap-4 p-6">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${k.chip}`}>
              <span className="material-symbols-outlined icon-fill text-[24px]">{k.icon}</span>
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gray-900">{k.count}</span>
              <span className="text-sm font-medium text-gray-500">{k.label}</span>
            </div>
          </GlassCard>
        ))}
      </StaggerGroup>

      <ScrollReveal delay={0.1}>
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Presensi Hari Ini</h2>
            <p className="mt-1 text-sm text-gray-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {alreadyCheckedIn ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[22px]">task_alt</span>
                Kamu telah check-in hari ini. Semangat belajar!
              </div>
            ) : (
              <button
                type="button"
                onClick={() => checkIn(CURRENT_SISWA_ID)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97]"
              >
                Check-in Sekarang
              </button>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Butuh Dispensasi?</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ajukan surat izin, sakit, atau dispensasi — laporan langsung masuk ke wali kelasmu.
            </p>
            <button
              type="button"
              onClick={() => setOpenForm((v) => !v)}
              className="mt-6 w-full rounded-xl border-2 border-emerald-600 py-3 font-medium text-emerald-600 transition-all duration-200 hover:bg-emerald-50 active:scale-[0.97]"
            >
              {openForm ? 'Tutup Form' : 'Buat Pengajuan'}
            </button>
          </GlassCard>
        </section>
      </ScrollReveal>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          Pengajuan berhasil dikirim dan menunggu persetujuan wali kelas.
        </div>
      )}

      {openForm && (
        <GlassCard className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">Buat Pengajuan Izin</h2>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(['Izin', 'Sakit', 'Dispensasi'] as JenisIzin[]).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, jenis: j }))}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    form.jenis === j
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 bg-white text-gray-500 hover:border-emerald-200'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input
                  type="date"
                  value={form.tanggalMulai}
                  onChange={(e) => setForm((f) => ({ ...f, tanggalMulai: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
                <input
                  type="date"
                  value={form.tanggalSelesai}
                  min={form.tanggalMulai}
                  onChange={(e) => setForm((f) => ({ ...f, tanggalSelesai: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Alasan</label>
              <textarea
                value={form.alasan}
                onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
                rows={3}
                placeholder="Jelaskan alasan pengajuanmu…"
                className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition-colors hover:border-emerald-300">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setForm((f) => ({ ...f, lampiranNama: e.target.files?.[0]?.name ?? null }))}
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">upload_file</span>
              </span>
              <p className="text-sm font-medium text-gray-600">
                {form.lampiranNama ?? 'Unggah surat/bukti pendukung (opsional)'}
              </p>
              <p className="text-xs text-gray-400">Klik untuk memilih berkas — JPG, PNG, atau PDF</p>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-emerald-500/70"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined icon-fill animate-spin text-[18px]">progress_activity</span>
                  Mengirim pengajuan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined icon-fill text-[18px]">send</span>
                  Kirim Pengajuan
                </>
              )}
            </button>
          </form>
        </GlassCard>
      )}

      {myIzin.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Status Pengajuan</h2>
            <div className="flex flex-col gap-3">
              {myIzin.map((i) => (
                <GlassCard key={i.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {i.jenis} — {i.tanggalMulai === i.tanggalSelesai ? i.tanggalMulai : `${i.tanggalMulai} s/d ${i.tanggalSelesai}`}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">{i.alasan}</p>
                    {i.status === 'Ditolak' && i.alasanTolak && (
                      <p className="mt-1 text-sm font-medium text-red-600">Alasan penolakan: {i.alasanTolak}</p>
                    )}
                  </div>
                  <span className={`inline-flex w-max items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${IZIN_STATUS_STYLE[i.status]}`}>
                    {i.status === 'Menunggu' && <span className="material-symbols-outlined icon-fill text-[14px]">hourglass_empty</span>}
                    {i.status === 'Disetujui' && <span className="material-symbols-outlined icon-fill text-[14px]">check_circle</span>}
                    {i.status === 'Ditolak' && <span className="material-symbols-outlined icon-fill text-[14px]">cancel</span>}
                    {i.status}
                  </span>
                </GlassCard>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <section className="flex flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Kehadiran</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari tanggal, status, keterangan…"
                className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Waktu</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{record.tanggal}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">{record.waktu}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{record.keterangan}</td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                      Belum ada catatan kehadiran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
