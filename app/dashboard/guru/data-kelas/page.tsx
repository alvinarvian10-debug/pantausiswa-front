'use client';

import { useMemo, useState } from 'react';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_GURU_ID, useAppData } from '../../../../lib/store';

const STATUS_STYLE: Record<string, string> = {
  Hadir: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Sakit: 'bg-amber-50 text-amber-700 ring-amber-100',
  Izin: 'bg-blue-50 text-blue-700 ring-blue-100',
  Alpa: 'bg-red-50 text-red-700 ring-red-100',
  'Belum Presensi': 'bg-slate-50 text-slate-500 ring-slate-100',
};

export default function DataKelasPage() {
  const { kelas, siswa, presensi } = useAppData();
  const [activeKelasId, setActiveKelasId] = useState<string | null>(null);

  const myKelas = useMemo(
    () => kelas.filter((k) => k.waliKelasId === CURRENT_GURU_ID),
    [kelas],
  );

  const activeKelas = myKelas.find((k) => k.id === activeKelasId) ?? myKelas[0] ?? null;

  const today = new Date().toISOString().slice(0, 10);

  const roster = useMemo(() => {
    if (!activeKelas) return [];
    return siswa
      .filter((s) => s.kelasId === activeKelas.id)
      .map((s) => {
        const record = presensi.find((p) => p.siswaId === s.id && p.tanggal === today);
        return { siswa: s, status: record?.status ?? 'Belum Presensi', keterangan: record?.keterangan ?? '' };
      });
  }, [activeKelas, siswa, presensi, today]);

  const summary = useMemo(() => {
    const hadir = roster.filter((r) => r.status === 'Hadir').length;
    const tidakHadir = roster.length - hadir;
    return { hadir, tidakHadir, total: roster.length };
  }, [roster]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Data Kelas</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Lihat presensi hari ini untuk setiap kelas yang kamu ampu.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <div className="flex flex-wrap gap-3">
          {myKelas.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setActiveKelasId(k.id)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                activeKelas?.id === k.id
                  ? 'bg-emerald-600 text-white shadow-cta'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {k.nama}
            </button>
          ))}
          {myKelas.length === 0 && (
            <p className="text-sm text-gray-400">Kamu belum menjadi wali kelas manapun.</p>
          )}
        </div>
      </ScrollReveal>

      {activeKelas && (
        <>
          <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <GlassCard className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">groups</span>
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900">{summary.total}</span>
                <span className="text-sm font-medium text-gray-500">Total Siswa — {activeKelas.nama}</span>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">how_to_reg</span>
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900">{summary.hadir}</span>
                <span className="text-sm font-medium text-gray-500">Hadir Hari Ini</span>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">person_off</span>
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900">{summary.tidakHadir}</span>
                <span className="text-sm font-medium text-gray-500">Tidak Hadir / Belum Presensi</span>
              </div>
            </GlassCard>
          </StaggerGroup>

          <ScrollReveal delay={0.1}>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4 font-semibold">Siswa</th>
                    <th className="px-6 py-4 font-semibold">NIS</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.siswa.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.siswa.nama} tone={r.siswa.tone} className="h-9 w-9 text-xs" />
                          <span className="font-medium text-gray-900">{r.siswa.nama}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{r.siswa.nis}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{r.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </>
      )}
    </main>
  );
}
