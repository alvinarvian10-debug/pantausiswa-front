'use client';

import { useMemo, useState } from 'react';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_GURU_ID, IzinRequest, useAppData } from '../../../../lib/store';

const STATUS_STYLE: Record<string, string> = {
  Menunggu: 'bg-amber-50 text-amber-700 ring-amber-100',
  Disetujui: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-700 ring-red-100',
};

const JENIS_ICON: Record<string, string> = {
  Izin: 'description',
  Sakit: 'sick',
  Dispensasi: 'event_available',
};

export default function PersetujuanIzinPage() {
  const { kelas, izin, getSiswa, prosesIzin, tambahRiwayatGuru } = useAppData();
  const [activeKelasId, setActiveKelasId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<IzinRequest | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [showAll, setShowAll] = useState(false);

  const myKelas = useMemo(() => kelas.filter((k) => k.waliKelasId === CURRENT_GURU_ID), [kelas]);
  const activeKelas = myKelas.find((k) => k.id === activeKelasId) ?? myKelas[0] ?? null;

  const kelasIzin = useMemo(() => {
    if (!activeKelas) return [];
    const list = izin.filter((i) => i.kelasId === activeKelas.id);
    return showAll ? list : list.filter((i) => i.status === 'Menunggu');
  }, [izin, activeKelas, showAll]);

  const pendingCount = useMemo(
    () => (activeKelas ? izin.filter((i) => i.kelasId === activeKelas.id && i.status === 'Menunggu').length : 0),
    [izin, activeKelas],
  );

  const handleApprove = (req: IzinRequest) => {
    prosesIzin(req.id, 'Disetujui');
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Menyetujui izin', `Menyetujui pengajuan ${req.jenis.toLowerCase()} atas nama ${getSiswa(req.siswaId)?.nama ?? '-'}`);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !alasanTolak.trim()) return;
    prosesIzin(rejectTarget.id, 'Ditolak', alasanTolak.trim());
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Menolak izin', `Menolak pengajuan ${rejectTarget.jenis.toLowerCase()} atas nama ${getSiswa(rejectTarget.siswaId)?.nama ?? '-'} — ${alasanTolak.trim()}`);
    setRejectTarget(null);
    setAlasanTolak('');
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Persetujuan Izin</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Tinjau dan setujui pengajuan izin, sakit, atau dispensasi dari siswa di kelasmu.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            {myKelas.map((k) => {
              const count = izin.filter((i) => i.kelasId === k.id && i.status === 'Menunggu').length;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setActiveKelasId(k.id)}
                  className={`relative rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    activeKelas?.id === k.id
                      ? 'bg-emerald-600 text-white shadow-cta'
                      : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {k.nama}
                  {count > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Tampilkan yang sudah diproses
          </label>
        </div>
      </ScrollReveal>

      {activeKelas && (
        <StaggerGroup key={`${activeKelas.id}-${showAll}`} as="div" className="flex flex-col gap-4">
          {kelasIzin.map((req) => {
            const s = getSiswa(req.siswaId);
            return (
              <GlassCard key={req.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <Avatar name={s?.nama ?? '?'} tone={s?.tone} className="h-11 w-11" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{s?.nama ?? 'Siswa tidak ditemukan'}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-100">
                          <span className="material-symbols-outlined text-[12px]">{JENIS_ICON[req.jenis]}</span>
                          {req.jenis}
                        </span>
                        <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[req.status]}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {req.tanggalMulai === req.tanggalSelesai ? req.tanggalMulai : `${req.tanggalMulai} s/d ${req.tanggalSelesai}`}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{req.alasan}</p>
                      {req.lampiranNama && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-inset ring-blue-100">
                          <span className="material-symbols-outlined text-[12px]">attach_file</span>
                          {req.lampiranNama}
                        </span>
                      )}
                      {req.status === 'Ditolak' && req.alasanTolak && (
                        <p className="mt-2 text-sm font-medium text-red-600">Alasan penolakan: {req.alasanTolak}</p>
                      )}
                    </div>
                  </div>
                  {req.status === 'Menunggu' && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectTarget(req); setAlasanTolak(''); }}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
          {kelasIzin.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
              {pendingCount === 0 ? 'Tidak ada pengajuan izin yang menunggu.' : 'Tidak ada data untuk ditampilkan.'}
            </div>
          )}
        </StaggerGroup>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Tolak Pengajuan {getSiswa(rejectTarget.siswaId)?.nama}
            </h2>
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleReject}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Alasan Penolakan</label>
                <textarea
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  rows={3}
                  required
                  placeholder="Contoh: Bertepatan dengan jadwal ujian/praktikum"
                  className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
