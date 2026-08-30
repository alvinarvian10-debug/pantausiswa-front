'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import GlassCard from '../../../components/GlassCard';
import Avatar from '../../../components/Avatar';
import ScrollReveal from '../../../components/ScrollReveal';
import StaggerGroup from '../../../components/StaggerGroup';
import AnimatedCounter from '../../../components/AnimatedCounter';
import { useAppData } from '../../../lib/store';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function AdminDashboard() {
  const { siswa, presensi, peminjaman, aduan, getSiswa, getFasilitas } = useAppData();

  const today = new Date().toISOString().slice(0, 10);
  const todayPresensi = presensi.filter((p) => p.tanggal === today);
  const kehadiranPersen = todayPresensi.length > 0
    ? Math.round((todayPresensi.filter((p) => p.status === 'Hadir').length / todayPresensi.length) * 100)
    : 0;
  const fasilitasDipinjam = peminjaman.filter((p) => p.status === 'Dipinjam').length;
  const aduanTerbuka = aduan.filter((a) => a.status !== 'Selesai').length;

  const STATS = [
    {
      label: 'Siswa Aktif',
      value: siswa.length,
      suffix: '',
      sub: 'Siswa Terdaftar',
      icon: 'school',
      iconClass: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
    },
    {
      label: 'Kehadiran Hari Ini',
      value: kehadiranPersen,
      suffix: '%',
      sub: 'Rata-rata seluruh kelas',
      icon: 'event_available',
      iconClass: 'bg-teal-50 text-teal-500 ring-teal-100',
      progress: kehadiranPersen,
    },
    {
      label: 'Fasilitas Dipinjam',
      value: fasilitasDipinjam,
      suffix: '',
      sub: 'Item Aktif',
      icon: 'inventory_2',
      iconClass: 'bg-blue-50 text-blue-500 ring-blue-100',
    },
    {
      label: 'Aduan Terbuka',
      value: aduanTerbuka,
      suffix: '',
      sub: 'Tiket Perlu Tindakan',
      icon: 'report_problem',
      iconClass: 'bg-red-50 text-red-500 ring-red-100',
      badge: aduanTerbuka > 0 ? 'Baru' : undefined,
    },
  ];

  const CHART = useMemo(() => {
    const base = kehadiranPersen || 85;
    const deltas = [-8, -3, 2, 5, 0];
    return HARI.map((day, i) => {
      const hadir = Math.max(60, Math.min(97, base + deltas[i]));
      const izin = Math.round((100 - hadir) * 0.6);
      const alpa = 100 - hadir - izin;
      return { day, hadir, izin, alpa };
    });
  }, [kehadiranPersen]);

  return (
    <main className="mx-auto w-full max-w-content flex-1 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Global Stats */}
        <StaggerGroup
          as="div"
          aria-label="Statistik sekolah"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat) => (
            <GlassCard
              key={stat.label}
              className="flex h-full flex-col justify-between p-6 md:p-7"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="pt-1 text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${stat.iconClass}`}
                >
                  <span className="material-symbols-outlined icon-fill text-[22px]">
                    {stat.icon}
                  </span>
                </span>
              </div>
              <div>
                <p className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  {stat.badge && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {stat.badge}
                    </span>
                  )}
                </p>
                {stat.progress != null ? (
                  <div
                    className="mt-3 h-1.5 w-full rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={stat.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={stat.label}
                  >
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">{stat.sub}</p>
                )}
              </div>
            </GlassCard>
          ))}
        </StaggerGroup>

        {/* Analytics & Ticketing */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TrendChart chart={CHART} />
          <TicketList aduan={aduan} getSiswa={getSiswa} />
        </section>

        {/* Peminjaman Table */}
        <BorrowTable peminjaman={peminjaman} getSiswa={getSiswa} getFasilitas={getFasilitas} />
      </div>
    </main>
  );
}

function TrendChart({ chart }: { chart: { day: string; hadir: number; izin: number; alpa: number }[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ScrollReveal delay={0.1} className="h-full">
      <GlassCard className="flex h-auto flex-col p-6 md:h-[400px] md:p-8">
        <h3 className="mb-1 text-lg font-bold tracking-tight text-gray-900">
          Tren Kehadiran Sekolah
        </h3>
        <p className="mb-6 text-sm text-gray-400">Minggu ini</p>

        <div
          role="img"
          aria-label="Diagram batang tren kehadiran harian: Senin 80%, Selasa 85%, Rabu 90%, Kamis 95%, Jumat 88%"
          className="relative flex-1 border-b border-gray-100 pb-10 pl-1"
        >
          <div className="flex h-full min-h-[160px] items-end justify-between gap-3 sm:gap-6">
            {chart.map((d, dayIndex) => (
              <div
                key={d.day}
                className="group relative flex h-full flex-1 items-end"
              >
                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900/90 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {d.hadir}%
                </span>
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <motion.div
                    style={{ height: `${d.hadir}%`, transformOrigin: 'bottom' }}
                    initial={shouldReduceMotion ? undefined : { scaleY: 0 }}
                    whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: dayIndex * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-1/3 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-[filter] duration-300 group-hover:brightness-110"
                  />
                  <motion.div
                    style={{ height: `${d.izin}%`, transformOrigin: 'bottom' }}
                    initial={shouldReduceMotion ? undefined : { scaleY: 0 }}
                    whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: dayIndex * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-1/3 rounded-t-md bg-amber-300 transition-[filter] duration-300 group-hover:brightness-105"
                  />
                  <motion.div
                    style={{ height: `${d.alpa}%`, transformOrigin: 'bottom' }}
                    initial={shouldReduceMotion ? undefined : { scaleY: 0 }}
                    whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: dayIndex * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-1/3 rounded-t-md bg-red-300 transition-[filter] duration-300 group-hover:brightness-105"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 -bottom-7 flex justify-between gap-3 pl-1 sm:gap-6">
            {chart.map((d) => (
              <span
                key={d.day}
                className="flex-1 text-center text-xs font-medium text-gray-400"
              >
                {d.day.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4 md:mt-8">
          {[
            { c: 'bg-emerald-500', l: 'Hadir' },
            { c: 'bg-amber-300', l: 'Sakit/Izin' },
            { c: 'bg-red-300', l: 'Alpa' },
          ].map((item) => (
            <span
              key={item.l}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500"
            >
              <span className={`h-2.5 w-2.5 rounded-sm ${item.c}`} />
              {item.l}
            </span>
          ))}
        </div>
      </GlassCard>
    </ScrollReveal>
  );
}

const TICKET_STYLE: Record<string, { chip: string; dot: string }> = {
  Baru: { chip: 'bg-red-50 text-red-600 ring-red-100', dot: 'bg-red-500' },
  Proses: { chip: 'bg-amber-50 text-amber-600 ring-amber-100', dot: 'bg-amber-500' },
  Selesai: { chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', dot: 'bg-emerald-500' },
};

function TicketList({
  aduan,
  getSiswa,
}: {
  aduan: ReturnType<typeof useAppData>['aduan'];
  getSiswa: ReturnType<typeof useAppData>['getSiswa'];
}) {
  const latest = [...aduan]
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice(0, 4);

  return (
    <ScrollReveal delay={0.2} className="h-full">
      <GlassCard className="flex h-auto flex-col p-6 md:h-[400px] md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-gray-900">
              Tiket Aduan Terbaru
            </h3>
            <p className="text-sm text-gray-400">Fasilitas &amp; keluh kesah siswa</p>
          </div>
          <Link
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            href="/dashboard/admin/pengaduan"
          >
            Lihat Semua
          </Link>
        </div>

        <ul
          className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1"
          role="list"
        >
          {latest.map((ticket) => {
            const style = TICKET_STYLE[ticket.status];
            const pelapor = ticket.isAnonim ? 'Anonim' : getSiswa(ticket.siswaId)?.nama ?? '-';
            return (
              <li key={ticket.id}>
                <Link
                  href="/dashboard/admin/pengaduan"
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-emerald-200 hover:bg-white hover:shadow-glass"
                >
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-gray-900">
                      {ticket.judul}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">
                        person
                      </span>
                      {pelapor}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {ticket.status}
                  </span>
                </Link>
              </li>
            );
          })}
          {latest.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400">Belum ada aduan masuk.</li>
          )}
        </ul>
      </GlassCard>
    </ScrollReveal>
  );
}

function BorrowTable({
  peminjaman,
  getSiswa,
  getFasilitas,
}: {
  peminjaman: ReturnType<typeof useAppData>['peminjaman'];
  getSiswa: ReturnType<typeof useAppData>['getSiswa'];
  getFasilitas: ReturnType<typeof useAppData>['getFasilitas'];
}) {
  const active = peminjaman.filter((p) => p.status === 'Dipinjam');
  const isTerlambat = (batas: string) => new Date(batas) < new Date();

  return (
    <ScrollReveal delay={0.15}>
      <GlassCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white/60 px-6 py-5 sm:px-8">
          <h3 className="text-lg font-bold tracking-tight text-gray-900">
            Peminjaman Fasilitas Berjalan
          </h3>
          <Link
            href="/dashboard/admin/inventaris"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            Kelola Inventaris
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">
              Daftar peminjaman fasilitas yang sedang berjalan
            </caption>
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/60 text-xs uppercase tracking-wider text-gray-400">
                <th scope="col" className="px-6 py-4 font-semibold">
                  Peminjam
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Barang/Ruangan
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Pinjam
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Batas Kembali
                </th>
                <th scope="col" className="px-6 py-4 text-right font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map((row) => {
                const s = getSiswa(row.siswaId);
                const f = getFasilitas(row.fasilitasId);
                const terlambat = isTerlambat(row.batasKembali);
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={s?.nama ?? '?'}
                          tone={s?.tone ?? 'slate'}
                          className="h-9 w-9 text-xs"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {s?.nama ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f?.nama ?? '-'}
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-sm text-gray-500">
                      {row.tanggalPinjam}
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums text-sm text-gray-500">
                      {row.batasKembali.slice(11, 16)} WIB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                          terlambat
                            ? 'bg-red-50 text-red-600 ring-red-100'
                            : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                        }`}
                      >
                        {terlambat ? 'Terlambat' : 'Aman'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    Tidak ada peminjaman yang sedang berjalan.
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
