'use client';

import { useMemo } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_GURU_ID, useAppData } from '../../../../lib/store';

const AKSI_ICON: Record<string, string> = {
  'Menyetujui izin': 'check_circle',
  'Menolak izin': 'cancel',
  'Menilai tugas': 'grading',
  'Membuat tugas': 'add_task',
};

const AKSI_STYLE: Record<string, string> = {
  'Menyetujui izin': 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  'Menolak izin': 'bg-red-50 text-red-600 ring-red-100',
  'Menilai tugas': 'bg-blue-50 text-blue-600 ring-blue-100',
  'Membuat tugas': 'bg-amber-50 text-amber-600 ring-amber-100',
};

function formatWaktu(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  });
}

export default function RiwayatPage() {
  const { riwayatGuru } = useAppData();

  const myRiwayat = useMemo(
    () =>
      riwayatGuru
        .filter((r) => r.guruId === CURRENT_GURU_ID)
        .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()),
    [riwayatGuru],
  );

  const stats = useMemo(() => {
    const izinDiproses = myRiwayat.filter((r) => r.aksi.includes('izin')).length;
    const tugasDinilai = myRiwayat.filter((r) => r.aksi === 'Menilai tugas').length;
    const tugasDibuat = myRiwayat.filter((r) => r.aksi === 'Membuat tugas').length;
    return [
      { label: 'Izin Diproses', count: izinDiproses, icon: 'fact_check', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
      { label: 'Tugas Dinilai', count: tugasDinilai, icon: 'grading', chip: 'bg-blue-50 text-blue-600 ring-blue-100' },
      { label: 'Tugas Dibuat', count: tugasDibuat, icon: 'add_task', chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
    ];
  }, [myRiwayat]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Riwayat Aktivitas</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Rekam jejak seluruh aktivitas yang telah kamu lakukan di PantauSiswa.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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

      <ScrollReveal delay={0.1}>
        <GlassCard className="p-6">
          <ol className="flex flex-col">
            {myRiwayat.map((r, i) => (
              <li key={r.id} className="relative flex gap-4 pb-8 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${AKSI_STYLE[r.aksi] ?? 'bg-slate-50 text-slate-500 ring-slate-100'}`}>
                    <span className="material-symbols-outlined icon-fill text-[18px]">{AKSI_ICON[r.aksi] ?? 'circle'}</span>
                  </span>
                  {i < myRiwayat.length - 1 && <span className="absolute top-9 h-full w-px bg-slate-100" />}
                </div>
                <div className="flex flex-1 flex-col pb-1 pt-1.5">
                  <span className="text-sm font-semibold text-gray-900">{r.aksi}</span>
                  <span className="text-sm text-gray-500">{r.keterangan}</span>
                  <span className="mt-1 text-xs text-gray-400">{formatWaktu(r.waktu)}</span>
                </div>
              </li>
            ))}
            {myRiwayat.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada aktivitas tercatat.</p>
            )}
          </ol>
        </GlassCard>
      </ScrollReveal>
    </main>
  );
}
