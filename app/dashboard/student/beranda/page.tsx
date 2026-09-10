'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  apiMyIzin,
  apiMyPeminjaman,
  apiMyPresensi,
  apiMyTugas,
  type BackendIzin,
  type BackendPeminjaman,
  type BackendPresensi,
  type BackendTugas,
} from '../../../../lib/api';
import { CURRENT_SISWA_ID, useAppData } from '../../../../lib/store';

const kapital = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function StudentDashboard() {
  const { presensi, izin, tugas, submisi, peminjaman, getSiswa, getFasilitas } = useAppData();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = now?.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });

  const me = getSiswa(CURRENT_SISWA_ID);
  const today = new Date().toISOString().slice(0, 10);

  // Ringkasan dari backend bila terjangkau, lokal bila tidak.
  const [bePresensi, setBePresensi] = useState<BackendPresensi[] | null>(null);
  const [beTugas, setBeTugas] = useState<BackendTugas[] | null>(null);
  const [beIzin, setBeIzin] = useState<BackendIzin[] | null>(null);
  const [bePinjam, setBePinjam] = useState<BackendPeminjaman[] | null>(null);

  useEffect(() => {
    apiMyPresensi().then((r) => setBePresensi(r.data)).catch(() => setBePresensi(null));
    apiMyTugas().then(setBeTugas).catch(() => setBeTugas(null));
    apiMyIzin().then((r) => setBeIzin(r.data)).catch(() => setBeIzin(null));
    apiMyPeminjaman().then((r) => setBePinjam(r.data)).catch(() => setBePinjam(null));
  }, []);

  const sudahHadir = bePresensi !== null
    ? bePresensi.some((p) => p.tanggal.slice(0, 10) === today)
    : presensi.some((p) => p.siswaId === CURRENT_SISWA_ID && p.tanggal === today);

  const tugasAktif = useMemo(() => {
    if (beTugas !== null) {
      return beTugas
        .filter((t) => !t.sudahMengumpulkan)
        .slice(0, 2)
        .map((t) => ({
          key: `be-${t.id}`,
          mapel: t.mapel?.nama ?? '-',
          judul: t.judul,
          deskripsi: t.deskripsi,
          deadline: t.tenggat.slice(0, 10),
        }));
    }
    if (!me) return [];
    return tugas
      .filter((t) => t.kelasId === me.kelasId && !submisi.some((s) => s.tugasId === t.id && s.siswaId === CURRENT_SISWA_ID))
      .slice(0, 2)
      .map((t) => ({ key: `lokal-${t.id}`, mapel: t.mapel, judul: t.judul, deskripsi: t.deskripsi, deadline: t.deadline }));
  }, [beTugas, tugas, submisi, me]);

  const latestIzin = useMemo(() => {
    if (beIzin !== null) {
      const first = beIzin[0];
      if (!first) return null;
      return {
        jenis: kapital(first.jenis),
        tanggalMulai: first.tanggalMulai.slice(0, 10),
        alasan: first.keterangan,
        status: kapital(first.status),
      };
    }
    return izin.filter((i) => i.siswaId === CURRENT_SISWA_ID).sort((a, b) => new Date(b.diajukanPada).getTime() - new Date(a.diajukanPada).getTime())[0] ?? null;
  }, [beIzin, izin]);

  const activeLoan = useMemo(() => {
    if (bePinjam !== null) {
      const loan = bePinjam.find((p) => p.status === 'DIPINJAM');
      if (!loan) return null;
      return {
        icon: 'inventory_2',
        nama: loan.barang?.nama ?? '-',
        keperluan: loan.catatan ?? '',
        batasLabel: `${loan.tanggalKembali.slice(0, 10)}${loan.jamKembali ? ` ${loan.jamKembali}` : ''}`,
      };
    }
    const loan = peminjaman.find((p) => p.siswaId === CURRENT_SISWA_ID && p.status === 'Dipinjam');
    if (!loan) return null;
    return {
      icon: getFasilitas(loan.fasilitasId)?.icon ?? 'inventory_2',
      nama: getFasilitas(loan.fasilitasId)?.nama ?? '-',
      keperluan: loan.keperluan,
      batasLabel: `${loan.batasKembali.slice(0, 10)} ${loan.batasKembali.slice(11, 16)}`,
    };
  }, [bePinjam, peminjaman, getFasilitas]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      {/* Hero Widget: Presensi */}
      <ScrollReveal>
        <GlassCard className="group relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 p-6 md:flex-row md:items-center md:p-8">
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
                <span className="material-symbols-outlined icon-fill text-[18px]">
                  how_to_reg
                </span>
                Akses Cepat
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                Status Hari Ini:{' '}
                <span className={sudahHadir ? 'text-emerald-600' : 'text-amber-600'}>
                  {sudahHadir ? 'Sudah Hadir' : 'Belum Hadir'}
                </span>
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-gray-500">
                {sudahHadir
                  ? 'Presensimu hari ini sudah tercatat oleh sekretaris kelas. Semangat belajar!'
                  : 'Presensi kehadiran dikelola oleh sekretaris kelas. Hubungi sekretaris jika ada kesalahan data.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600">
                  <span className="material-symbols-outlined icon-fill text-[20px]">how_to_reg</span>
                  Presensi dikelola sekretaris kelas
                </span>
                <Link
                  href="/dashboard/student/peminjaman"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-6 py-3 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Peminjaman Fasilitas
                </Link>
                <Link
                  href="/dashboard/student/tugas"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-6 py-3 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Tugas
                </Link>
              </div>
            </div>

            {/* Clock */}
            <div className="flex min-w-[180px] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-8 shadow-glass backdrop-blur-sm">
              <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Waktu Saat Ini
              </span>
              <time
                className="text-5xl font-bold tabular-nums tracking-tight text-gray-900"
                suppressHydrationWarning
              >
                {clock ?? '--:--'}
              </time>
              <span className="mt-1 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100">
                WIB · Indonesia Barat
              </span>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* Grid Section */}
      <StaggerGroup
        as="div"
        className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8"
      >
        {/* Tugas Aktif */}
        <GlassCard className="flex h-full flex-col p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-[20px] text-amber-500">
                assignment
              </span>
              Tugas Aktif
            </h4>
            <Link
              className="rounded-md text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
              href="/dashboard/student/tugas"
            >
              Lihat Semua
            </Link>
          </div>
          <ul className="mt-4 flex flex-col gap-1">
            {tugasAktif.map((t) => {
              const terlambat = new Date(t.deadline) < new Date(today);
              return (
                <li key={t.key}>
                  <Link
                    href="/dashboard/student/tugas"
                    className="group -mx-2 flex flex-col gap-1.5 rounded-xl px-2 py-3 transition-colors hover:bg-white/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-emerald-700">
                        {t.mapel} — {t.judul}
                      </span>
                      <span
                        className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                          terlambat
                            ? 'bg-red-50 text-red-600 ring-red-100'
                            : 'bg-amber-50 text-amber-600 ring-amber-100'
                        }`}
                      >
                        {t.deadline}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">{t.deskripsi}</p>
                  </Link>
                </li>
              );
            })}
            {tugasAktif.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">Semua tugas sudah dikumpulkan 🎉</p>
            )}
          </ul>
        </GlassCard>

        {/* Status Izin */}
        <GlassCard className="flex h-full flex-col p-6">
          <div className="flex items-center border-b border-gray-100 pb-4">
            <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-[20px] text-blue-500">
                medical_services
              </span>
              Status Pengajuan Izin
            </h4>
          </div>
          <div className="flex flex-1 items-center py-4">
            {latestIzin ? (
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-6 text-center shadow-glass">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm ring-1 ring-inset ring-blue-100/60">
                  <span className="material-symbols-outlined icon-fill text-[28px]">
                    {latestIzin.status === 'Menunggu' ? 'pending_actions' : latestIzin.status === 'Disetujui' ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <h5 className="mb-1 text-sm font-semibold text-gray-900">
                  {latestIzin.jenis} — {latestIzin.tanggalMulai}
                </h5>
                <p className="mb-4 text-xs text-gray-500">{latestIzin.alasan}</p>
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${
                  latestIzin.status === 'Menunggu'
                    ? 'bg-amber-50 text-amber-600 ring-amber-100'
                    : latestIzin.status === 'Disetujui'
                      ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                      : 'bg-red-50 text-red-600 ring-red-100'
                }`}>
                  {latestIzin.status === 'Menunggu' ? 'Menunggu Validasi' : latestIzin.status}
                </span>
              </div>
            ) : (
              <p className="w-full py-6 text-center text-sm text-gray-400">Belum ada pengajuan izin.</p>
            )}
          </div>
        </GlassCard>

        {/* Peminjaman Aktif */}
        <GlassCard className="flex h-full flex-col p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-[20px] text-emerald-500">
                business_center
              </span>
              Peminjaman Aktif
            </h4>
            <Link
              className="rounded-md text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
              href="/dashboard/student/peminjaman"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="flex flex-1 items-center py-4">
            {activeLoan ? (
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-6 shadow-glass">
                <div
                  aria-hidden="true"
                  className="absolute -right-4 -top-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50"
                >
                  <span className="material-symbols-outlined text-[36px] text-emerald-200">
                    {activeLoan.icon}
                  </span>
                </div>
                <div className="relative z-10">
                  <h5 className="mb-1 pr-10 text-sm font-semibold text-gray-900">
                    {activeLoan.nama}
                  </h5>
                  <p className="mb-5 text-xs text-gray-500">{activeLoan.keperluan}</p>
                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/90 px-4 py-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Batas Kembali
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-red-500">
                      <span className="material-symbols-outlined icon-fill text-[16px]">schedule</span>
                      {activeLoan.batasLabel}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="w-full py-6 text-center text-sm text-gray-400">Tidak ada peminjaman aktif.</p>
            )}
          </div>
        </GlassCard>
      </StaggerGroup>
    </main>
  );
}
