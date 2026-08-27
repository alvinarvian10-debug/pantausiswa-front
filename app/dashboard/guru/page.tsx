'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GlassCard from '../../../components/GlassCard';
import Avatar from '../../../components/Avatar';
import ScrollReveal from '../../../components/ScrollReveal';
import StaggerGroup from '../../../components/StaggerGroup';
import AnimatedCounter from '../../../components/AnimatedCounter';

const REQUESTS = [
  {
    name: 'Ahmad Faisal',
    tone: 'emerald' as const,
    tag: 'Sakit — Demam',
    tagClass: 'bg-orange-50 text-orange-600 ring-orange-100',
    meta: 'Hari ini',
    linkLabel: 'Lihat Surat Dokter',
    linkIcon: 'description',
  },
  {
    name: 'Siti Nurhaliza',
    tone: 'slate' as const,
    tag: 'Izin — Keluarga',
    tagClass: 'bg-blue-50 text-blue-600 ring-blue-100',
    meta: 'Besok',
    linkLabel: 'Lihat Pesan Wali',
    linkIcon: 'chat',
  },
];

export default function GuruDashboard() {
  const [today, setToday] = useState('');

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

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-8 p-4 sm:p-6 md:p-10">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
            Selamat Datang, <span className="text-emerald-600">Bapak Budi</span>
          </h1>
          <p className="flex items-center gap-2 text-base text-gray-500">
            <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-500">
              today
            </span>
            {today || '\u00A0'}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 md:self-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Catatan Baru
        </button>
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
                <AnimatedCounter value={32} suffix="/35" />
              </span>
              <span className="text-sm text-gray-400">siswa hadir</span>
            </p>
            <div
              className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={91}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Persentase kehadiran kelas"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                style={{ width: '91%' }}
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
                <AnimatedCounter value={3} />
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
              <AnimatedCounter value={12} />
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
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              3 Baru
            </span>
          </h2>
          <Link
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            href="/dashboard/guru/persetujuan-izin"
          >
            Lihat Semua
          </Link>
        </div>

        <StaggerGroup as="div" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {REQUESTS.map((req) => (
            <GlassCard
              key={req.name}
              className="flex h-full flex-col items-start gap-5 p-6 sm:flex-row sm:items-center"
            >
              <Avatar
                name={req.name}
                tone={req.tone}
                className="h-14 w-14 rounded-2xl text-lg"
              />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base font-semibold text-gray-900">
                  {req.name}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${req.tagClass}`}
                  >
                    {req.tag}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <span className="material-symbols-outlined text-[16px]">
                      schedule
                    </span>
                    {req.meta}
                  </span>
                </div>
                <Link
                  className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  href="/dashboard/guru/persetujuan-izin"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {req.linkIcon}
                  </span>
                  {req.linkLabel}
                  <span className="material-symbols-outlined text-[14px] opacity-0 transition-opacity group-hover:opacity-100">
                    open_in_new
                  </span>
                </Link>
              </div>
              <div className="flex w-full gap-3 sm:mt-0 sm:w-auto sm:flex-col">
                <button className="flex-1 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 sm:flex-none">
                  Setujui
                </button>
                <button className="flex-1 rounded-xl border border-gray-200 bg-white/60 px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 sm:flex-none">
                  Tolak
                </button>
              </div>
            </GlassCard>
          ))}
        </StaggerGroup>
      </section>

      {/* Rekap Kehadiran */}
      <AttendanceTable />
    </main>
  );
}

const ROWS = [
  {
    name: 'Andi Saputra',
    tone: 'emerald' as const,
    checkIn: '06:45',
    status: 'Hadir',
    statusClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    dotClass: 'bg-emerald-500',
    note: '-',
  },
  {
    name: 'Bima Arya',
    tone: 'amber' as const,
    checkIn: '07:15',
    status: 'Terlambat',
    statusClass: 'bg-amber-50 text-amber-600 ring-amber-100',
    dotClass: 'bg-amber-500',
    note: 'Macet di perjalanan',
  },
  {
    name: 'Citra Lestari',
    tone: 'red' as const,
    checkIn: null,
    status: 'Alpa',
    statusClass: 'bg-red-50 text-red-600 ring-red-100',
    dotClass: 'bg-red-500',
    note: 'Belum ada keterangan',
    contact: true,
  },
  {
    name: 'Diana Putri',
    tone: 'blue' as const,
    checkIn: null,
    status: 'Sakit',
    statusClass: 'bg-blue-50 text-blue-600 ring-blue-100',
    dotClass: 'bg-blue-500',
    note: 'Surat dokter terlampir',
    attachment: true,
  },
];

function AttendanceTable() {
  return (
    <ScrollReveal delay={0.15}>
      <GlassCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white/60 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            Rekap Kehadiran Live — Kelas 10 MIPA 1
          </h2>
          <div className="flex gap-2">
            <button
              aria-label="Filter data"
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <span className="material-symbols-outlined text-[20px]">
                filter_list
              </span>
            </button>
            <button
              aria-label="Unduh rekap"
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Rekap kehadiran siswa kelas 10 MIPA 1 hari ini
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
                <th scope="col" className="px-6 py-4 text-right font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {ROWS.map((row) => (
                <tr
                  key={row.name}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={row.name}
                        tone={row.tone}
                        className="h-9 w-9 text-xs"
                      />
                      <span className="font-medium text-gray-900">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono tabular-nums text-gray-500">
                    {row.checkIn ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${row.statusClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${row.dotClass}`}
                      />
                      {row.status}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 ${row.contact ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {row.note}
                      {row.attachment && (
                        <button
                          aria-label="Unduh lampiran"
                          className="rounded-md text-emerald-600 transition-colors hover:text-emerald-700"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            attachment
                          </span>
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.contact ? (
                      <button className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                        Hubungi
                      </button>
                    ) : (
                      <button
                        aria-label={`Opsi untuk ${row.name}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          more_vert
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-400 sm:px-8">
          <span>Menampilkan 1–4 dari 35 siswa</span>
          <div className="flex gap-1">
            <button
              aria-label="Halaman sebelumnya"
              disabled
              className="rounded-lg p-1.5 text-gray-300 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            <button
              aria-label="Halaman berikutnya"
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-emerald-600"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </GlassCard>
    </ScrollReveal>
  );
}
