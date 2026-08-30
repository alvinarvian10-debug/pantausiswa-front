'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../components/GlassCard';
import Avatar from '../../../components/Avatar';
import ScrollReveal from '../../../components/ScrollReveal';
import StaggerGroup from '../../../components/StaggerGroup';
import AnimatedCounter from '../../../components/AnimatedCounter';
import { CURRENT_GURU_ID, useAppData } from '../../../lib/store';

export default function GuruDashboard() {
  const [today, setToday] = useState('');
  const { kelas, siswa, presensi, izin, submisi, tugas, guru, getSiswa } = useAppData();

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    );
  }, []);

  const myKelas = useMemo(() => kelas.filter((k) => k.waliKelasId === CURRENT_GURU_ID), [kelas]);
  const me = guru.find((g) => g.id === CURRENT_GURU_ID);
  const primaryKelas = myKelas[0] ?? null;
  const todayDate = new Date().toISOString().slice(0, 10);

  const roster = useMemo(() => {
    if (!primaryKelas) return [];
    return siswa
      .filter((s) => s.kelasId === primaryKelas.id)
      .map((s) => {
        const record = presensi.find((p) => p.siswaId === s.id && p.tanggal === todayDate);
        return { siswa: s, status: record?.status ?? null, waktu: record?.waktu ?? null, keterangan: record?.keterangan ?? '-' };
      });
  }, [primaryKelas, siswa, presensi, todayDate]);

  const hadirCount = roster.filter((r) => r.status === 'Hadir').length;
  const persenHadir = roster.length > 0 ? Math.round((hadirCount / roster.length) * 100) : 0;

  const pendingIzin = useMemo(
    () => izin.filter((i) => myKelas.some((k) => k.id === i.kelasId) && i.status === 'Menunggu'),
    [izin, myKelas],
  );

  const tugasPerluDinilai = useMemo(
    () => submisi.filter((s) => s.status === 'Menunggu Nilai' && tugas.some((t) => t.id === s.tugasId && t.guruId === CURRENT_GURU_ID)).length,
    [submisi, tugas],
  );

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-8 p-4 sm:p-6 md:p-10">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
            Selamat Datang, <span className="text-emerald-600">{me?.nama ?? 'Guru'}</span>
          </h1>
          <p className="flex items-center gap-2 text-base text-gray-500">
            <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-500">
              today
            </span>
            {today || '\u00A0'}
          </p>
        </div>
        <Link
          href="/dashboard/guru/kelola-tugas"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Beri Tugas Baru
        </Link>
      </div>

      {/* Quick Stats */}
      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Kehadiran Kelas */}
        <GlassCard className="group relative h-full overflow-hidden p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 select-none opacity-[0.06]"
          >
            <span className="material-symbols-outlined icon-fill text-[120px] leading-none text-emerald-600">
              groups
            </span>
          </div>
          <div className="relative z-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-inset ring-emerald-100">
              <span className="material-symbols-outlined icon-fill text-[24px]">
                how_to_reg
              </span>
            </div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Kehadiran Kelas
            </p>
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                <AnimatedCounter value={hadirCount} suffix={`/${roster.length}`} />
              </span>
              <span className="text-sm text-gray-400">siswa hadir</span>
            </p>
            <div
              className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={persenHadir}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Persentase kehadiran kelas"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                style={{ width: `${persenHadir}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Menunggu Validasi */}
        <GlassCard className="relative h-full overflow-hidden p-7">
          <div className="flex h-full flex-col justify-between">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-inset ring-orange-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">
                  pending_actions
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                Perlu Tindakan
              </span>
            </div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Menunggu Validasi
            </p>
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                <AnimatedCounter value={pendingIzin.length} />
              </span>
              <span className="text-sm text-gray-400">pengajuan izin</span>
            </p>
          </div>
        </GlassCard>

        {/* Tugas Dinilai */}
        <GlassCard className="h-full overflow-hidden p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 ring-1 ring-inset ring-blue-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">
              assignment_turned_in
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            Tugas Perlu Dinilai
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-gray-900">
              <AnimatedCounter value={tugasPerluDinilai} />
            </span>
            <span className="text-sm text-gray-400">dokumen</span>
          </p>
          <svg
            className="mt-5 h-10 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 30"
            aria-hidden="true"
          >
            <path
              d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5 L100,30 L0,30 Z"
              fill="currentColor"
              className="text-emerald-500/10"
            />
            <path
              d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              className="animate-draw-line text-emerald-500 [stroke-dasharray:140]"
            />
          </svg>
        </GlassCard>
      </StaggerGroup>

      {/* Persetujuan Izin */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-gray-900">
            Persetujuan Izin &amp; Dispensasi
            {pendingIzin.length > 0 && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                {pendingIzin.length} Baru
              </span>
            )}
          </h2>
          <Link
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            href="/dashboard/guru/persetujuan-izin"
          >
            Lihat Semua
          </Link>
        </div>

        <StaggerGroup as="div" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pendingIzin.slice(0, 4).map((req) => {
            const s = getSiswa(req.siswaId);
            return (
              <GlassCard
                key={req.id}
                className="flex h-full flex-col items-start gap-5 p-6 sm:flex-row sm:items-center"
              >
                <Avatar
                  name={s?.nama ?? '?'}
                  tone={s?.tone}
                  className="h-14 w-14 rounded-2xl text-lg"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-base font-semibold text-gray-900">
                    {s?.nama ?? 'Siswa tidak ditemukan'}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 ring-1 ring-inset ring-orange-100">
                      {req.jenis} — {req.alasan.length > 24 ? `${req.alasan.slice(0, 24)}…` : req.alasan}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {req.tanggalMulai}
                    </span>
                  </div>
                </div>
                <Link
                  href="/dashboard/guru/persetujuan-izin"
                  className="flex w-full gap-3 sm:mt-0 sm:w-auto sm:flex-col"
                >
                  <span className="flex-1 rounded-xl bg-emerald-500 px-5 py-2 text-center text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 sm:flex-none">
                    Tinjau
                  </span>
                </Link>
              </GlassCard>
            );
          })}
          {pendingIzin.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-gray-400">
              Tidak ada pengajuan izin yang menunggu saat ini.
            </div>
          )}
        </StaggerGroup>
      </section>

      {/* Rekap Kehadiran */}
      <AttendanceTable roster={roster} kelasNama={primaryKelas?.nama ?? '-'} />
    </main>
  );
}

interface RosterRow {
  siswa: { id: string; nama: string; tone: import('../../../lib/store').AvatarTone };
  status: string | null;
  waktu: string | null;
  keterangan: string;
}

const STATUS_STYLE: Record<string, { chip: string; dot: string }> = {
  Hadir: { chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', dot: 'bg-emerald-500' },
  Sakit: { chip: 'bg-blue-50 text-blue-600 ring-blue-100', dot: 'bg-blue-500' },
  Izin: { chip: 'bg-amber-50 text-amber-600 ring-amber-100', dot: 'bg-amber-500' },
  Alpa: { chip: 'bg-red-50 text-red-600 ring-red-100', dot: 'bg-red-500' },
};

function AttendanceTable({ roster, kelasNama }: { roster: RosterRow[]; kelasNama: string }) {
  return (
    <ScrollReveal delay={0.15}>
      <GlassCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white/60 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            Rekap Kehadiran Live — {kelasNama}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Rekap kehadiran siswa {kelasNama} hari ini
            </caption>
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/60 text-xs uppercase tracking-wider text-gray-400">
                <th scope="col" className="px-6 py-4 font-semibold">
                  Nama Siswa
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Check-In
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {roster.map((row) => {
                const style = row.status ? STATUS_STYLE[row.status] : null;
                return (
                  <tr
                    key={row.siswa.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={row.siswa.nama}
                          tone={row.siswa.tone}
                          className="h-9 w-9 text-xs"
                        />
                        <span className="font-medium text-gray-900">
                          {row.siswa.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-gray-500">
                      {row.waktu ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      {style ? (
                        <span
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${style.chip}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {row.status}
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-inset ring-slate-100">
                          Belum Presensi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{row.keterangan}</td>
                  </tr>
                );
              })}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    Belum ada data siswa untuk kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </ScrollReveal>
  );
}
