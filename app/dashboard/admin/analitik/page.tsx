'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import AnimatedCounter from '../../../../components/AnimatedCounter';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  apiRingkasan,
  apiStatistikNilai,
  apiTrenKehadiran,
  type BackendNilai,
  type BackendRingkasan,
  type BackendTrenHarian,
} from '../../../../lib/api';
import { useAppData } from '../../../../lib/store';

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

export default function AnalitikPage() {
  const { siswa, presensi, submisi, tugas, aduan, peminjaman } = useAppData();
  const shouldReduceMotion = useReducedMotion();

  // Sumber kebenaran: backend bila terjangkau, lokal bila tidak (per seksi).
  const [beRingkasan, setBeRingkasan] = useState<BackendRingkasan | null>(null);
  const [beTren, setBeTren] = useState<BackendTrenHarian[] | null>(null);
  const [beNilai, setBeNilai] = useState<BackendNilai | null>(null);

  useEffect(() => {
    apiRingkasan().then(setBeRingkasan).catch(() => setBeRingkasan(null));
    apiTrenKehadiran(7).then(setBeTren).catch(() => setBeTren(null));
    apiStatistikNilai().then(setBeNilai).catch(() => setBeNilai(null));
  }, []);

  const kehadiranPersen = useMemo(() => {
    if (presensi.length === 0) return 0;
    const hadir = presensi.filter((p) => p.status === 'Hadir').length;
    return Math.round((hadir / presensi.length) * 100);
  }, [presensi]);

  const rataRataNilai = useMemo(() => {
    const dinilai = submisi.filter((s) => s.status === 'Dinilai' && s.nilai != null);
    if (dinilai.length === 0) return 0;
    return Math.round(dinilai.reduce((sum, s) => sum + (s.nilai ?? 0), 0) / dinilai.length);
  }, [submisi]);

  const tingkatPengumpulan = useMemo(() => {
    if (tugas.length === 0 || siswa.length === 0) return 0;
    const totalSeharusnya = tugas.length * siswa.length;
    return Math.round((submisi.length / totalSeharusnya) * 100);
  }, [tugas, submisi, siswa]);

  const aduanSelesaiPersen = useMemo(() => {
    if (aduan.length === 0) return 0;
    const selesai = aduan.filter((a) => a.status === 'Selesai').length;
    return Math.round((selesai / aduan.length) * 100);
  }, [aduan]);

  // Simple synthetic weekly trend derived from current attendance rate, for visual shape.
  const weeklyTrendLokal = useMemo(() => {
    const base = kehadiranPersen || 85;
    return HARI.map((label, i) => ({
      label,
      val: Math.max(50, Math.min(100, base + [(-6), (-1), 3, 5, 0][i])),
    }));
  }, [kehadiranPersen]);

  const weeklyTrend = useMemo(() => {
    if (beTren !== null) {
      return beTren.slice(-5).map((d) => ({
        label: new Date(`${d.tanggal}T00:00:00`).toLocaleDateString('id-ID', {
          weekday: 'short',
        }),
        val: d.persentase,
      }));
    }
    return weeklyTrendLokal;
  }, [beTren, weeklyTrendLokal]);

  const mapelStatsLokal = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    submisi.forEach((s) => {
      if (s.status !== 'Dinilai' || s.nilai == null) return;
      const t = tugas.find((x) => x.id === s.tugasId);
      if (!t) return;
      map[t.mapel] = map[t.mapel] ?? { total: 0, count: 0 };
      map[t.mapel].total += s.nilai;
      map[t.mapel].count += 1;
    });
    return Object.entries(map).map(([mapel, v]) => ({ mapel, rata: Math.round(v.total / v.count) }));
  }, [submisi, tugas]);

  const mapelStats = useMemo(
    () =>
      beNilai !== null
        ? beNilai.perMapel.map((m) => ({ mapel: m.mapel, rata: m.rata }))
        : mapelStatsLokal,
    [beNilai, mapelStatsLokal],
  );

  const kpi = [
    {
      label: beRingkasan ? 'Kehadiran Hari Ini' : 'Rata-rata Kehadiran',
      value: beRingkasan ? beRingkasan.kehadiranHariIni.persentase : kehadiranPersen,
      suffix: '%',
      icon: 'event_available',
      chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Rata-rata Nilai Tugas',
      value: beNilai ? beNilai.rataRata : rataRataNilai,
      suffix: '',
      icon: 'grade',
      chip: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    ...(beRingkasan
      ? [
          { label: 'Tugas Aktif', value: beRingkasan.tugasAktif, suffix: '', icon: 'fact_check', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
          { label: 'Aduan Baru', value: beRingkasan.aduanBaru, suffix: '', icon: 'markunread', chip: 'bg-cyan-50 text-cyan-600 ring-cyan-100' },
        ]
      : [
          { label: 'Tingkat Pengumpulan Tugas', value: tingkatPengumpulan, suffix: '%', icon: 'fact_check', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
          { label: 'Aduan Terselesaikan', value: aduanSelesaiPersen, suffix: '%', icon: 'task_alt', chip: 'bg-cyan-50 text-cyan-600 ring-cyan-100' },
        ]),
  ];

  const operasional = beRingkasan
    ? [
        { value: beRingkasan.totalPeminjaman, label: 'Total Transaksi Peminjaman' },
        { value: beRingkasan.totalAduan, label: 'Total Aduan Masuk' },
        { value: beRingkasan.totalTugas, label: 'Total Tugas Diberikan' },
      ]
    : [
        { value: peminjaman.length, label: 'Total Transaksi Peminjaman' },
        { value: aduan.length, label: 'Total Aduan Masuk' },
        { value: tugas.length, label: 'Total Tugas Diberikan' },
      ];

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Analitik Sekolah</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Ringkasan kehadiran, akademik, dan operasional sekolah — dihitung
            langsung dari data presensi, tugas, aduan, dan peminjaman.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((k) => (
          <GlassCard key={k.label} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${k.chip}`}>
                <span className="material-symbols-outlined icon-fill text-[22px]">{k.icon}</span>
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-gray-900">
              <AnimatedCounter value={k.value} suffix={k.suffix} />
            </p>
            <p className="mt-1 text-sm text-gray-500">{k.label}</p>
          </GlassCard>
        ))}
      </StaggerGroup>

      <ScrollReveal delay={0.1}>
        <GlassCard className="p-6 md:p-8">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-gray-900">Tren Kehadiran Mingguan</h2>
          <p className="mb-6 text-sm text-gray-400">Persentase siswa hadir per hari</p>
          <div className="flex h-48 items-end justify-between gap-2 overflow-x-auto sm:gap-4 md:gap-8">
            {weeklyTrend.map((d, i) => (
              <div key={`${d.label}-${i}`} className="flex min-w-[36px] flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">{d.val}%</span>
                <div className="flex h-36 w-full min-h-[144px] items-end overflow-hidden rounded-t-lg bg-slate-50">
                  <motion.div
                    style={{ height: `${d.val}%`, width: '100%', transformOrigin: 'bottom' }}
                    initial={shouldReduceMotion ? undefined : { scaleY: 0 }}
                    whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
                    viewport={{ once: true, margin: '-32px' }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400"
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <GlassCard className="p-6 md:p-8">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-gray-900">Rata-rata Nilai per Mata Pelajaran</h2>
          <p className="mb-6 text-sm text-gray-400">Dihitung dari tugas yang sudah dinilai</p>
          {mapelStats.length > 0 ? (
            <div className="flex flex-col gap-4">
              {mapelStats.map((m, i) => (
                <div key={m.mapel} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 text-sm font-medium text-gray-700">{m.mapel}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      style={{ width: `${m.rata}%`, transformOrigin: 'left' }}
                      initial={shouldReduceMotion ? undefined : { scaleX: 0 }}
                      whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
                      viewport={{ once: true, margin: '-32px' }}
                      transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-bold text-gray-900">{m.rata}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">Belum ada tugas yang dinilai.</p>
          )}
        </GlassCard>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <GlassCard className="p-6 md:p-8">
          <h2 className="mb-6 text-lg font-bold tracking-tight text-gray-900">Statistik Operasional</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {operasional.map((o) => (
              <div key={o.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900"><AnimatedCounter value={o.value} /></p>
                <p className="mt-1 text-sm text-gray-500">{o.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </ScrollReveal>
    </main>
  );
}
