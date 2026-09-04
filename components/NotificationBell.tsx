'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CURRENT_GURU_ID, CURRENT_SISWA_ID, useAppData } from '../lib/store';
import type { Role } from './Sidebar';

interface NotifItem {
  id: string;
  icon: string;
  iconClass: string;
  title: string;
  desc: string;
  time: string;
  href: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function NotificationBell({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { izin, submisi, aduan, tugas, getSiswa } = useAppData();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const notifs = useMemo<NotifItem[]>(() => {
    if (role === 'student') {
      const izinUpdates = izin
        .filter((i) => i.siswaId === CURRENT_SISWA_ID && i.status !== 'Menunggu' && i.diprosesPada)
        .map((i) => ({
          id: `izin-${i.id}`,
          icon: i.status === 'Disetujui' ? 'check_circle' : 'cancel',
          iconClass: i.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
          title: `Pengajuan ${i.jenis} ${i.status.toLowerCase()}`,
          desc: i.status === 'Ditolak' && i.alasanTolak ? i.alasanTolak : i.alasan,
          time: timeAgo(i.diprosesPada as string),
          href: '/dashboard/student/presensi',
        }));
      const nilaiBaru = submisi
        .filter((s) => s.siswaId === CURRENT_SISWA_ID && s.status === 'Dinilai')
        .map((s) => {
          const t = tugas.find((x) => x.id === s.tugasId);
          return {
            id: `nilai-${s.id}`,
            icon: 'grade',
            iconClass: 'bg-blue-50 text-blue-600',
            title: `Tugas dinilai: ${t?.judul ?? '-'}`,
            desc: `Nilai kamu: ${s.nilai}`,
            time: timeAgo(s.dikumpulkanPada),
            href: '/dashboard/student/tugas',
          };
        });
      const tanggapanAduan = aduan
        .filter((a) => a.siswaId === CURRENT_SISWA_ID && a.tanggapan)
        .map((a) => ({
          id: `aduan-${a.id}`,
          icon: 'forum',
          iconClass: 'bg-amber-50 text-amber-600',
          title: `Aduanmu ditanggapi: ${a.judul}`,
          desc: a.tanggapan as string,
          time: a.tanggal,
          href: '/dashboard/student/aduan',
        }));
      return [...izinUpdates, ...nilaiBaru, ...tanggapanAduan].slice(0, 8);
    }

    if (role === 'secretary') {
      return [];
    }

    if (role === 'guru') {
      const pending = izin
        .filter((i) => i.status === 'Menunggu')
        .map((i) => ({
          id: `izin-${i.id}`,
          icon: 'pending_actions',
          iconClass: 'bg-amber-50 text-amber-600',
          title: `Pengajuan ${i.jenis} baru`,
          desc: getSiswa(i.siswaId)?.nama ?? '-',
          time: timeAgo(i.diajukanPada),
          href: '/dashboard/guru/persetujuan-izin',
        }));
      const perluDinilai = submisi
        .filter((s) => s.status === 'Menunggu Nilai' && tugas.some((t) => t.id === s.tugasId && t.guruId === CURRENT_GURU_ID))
        .map((s) => {
          const t = tugas.find((x) => x.id === s.tugasId);
          return {
            id: `submisi-${s.id}`,
            icon: 'fact_check',
            iconClass: 'bg-blue-50 text-blue-600',
            title: `Tugas perlu dinilai: ${t?.judul ?? '-'}`,
            desc: getSiswa(s.siswaId)?.nama ?? '-',
            time: timeAgo(s.dikumpulkanPada),
            href: '/dashboard/guru/kelola-tugas',
          };
        });
      return [...pending, ...perluDinilai].slice(0, 8);
    }

    // admin
    const aduanBaru = aduan
      .filter((a) => a.status === 'Baru')
      .map((a) => ({
        id: `aduan-${a.id}`,
        icon: a.jenis === 'Fasilitas' ? 'build' : 'sentiment_dissatisfied',
        iconClass: 'bg-red-50 text-red-600',
        title: `Aduan baru: ${a.judul}`,
        desc: a.isAnonim ? 'Anonim' : getSiswa(a.siswaId)?.nama ?? '-',
        time: a.tanggal,
        href: '/dashboard/admin/pengaduan',
      }));
    const izinMenunggu = izin
      .filter((i) => i.status === 'Menunggu')
      .map((i) => ({
        id: `izin-${i.id}`,
        icon: 'pending_actions',
        iconClass: 'bg-amber-50 text-amber-600',
        title: `Izin menunggu persetujuan wali kelas`,
        desc: getSiswa(i.siswaId)?.nama ?? '-',
        time: timeAgo(i.diajukanPada),
        href: '/dashboard/guru/persetujuan-izin',
      }));
    return [...aduanBaru, ...izinMenunggu].slice(0, 8);
  }, [role, izin, submisi, aduan, tugas, getSiswa]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/80 hover:text-emerald-600"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {notifs.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white"
          >
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/60 bg-white shadow-glass-lg sm:w-96">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
          </div>
          <ul className="max-h-[70vh] overflow-y-auto sm:max-h-96">
            {notifs.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-gray-50 px-5 py-3.5 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.iconClass}`}>
                    <span className="material-symbols-outlined icon-fill text-[18px]">{n.icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="truncate text-xs text-gray-500">{n.desc}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{n.time}</p>
                  </div>
                </Link>
              </li>
            ))}
            {notifs.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-gray-400">
                Tidak ada notifikasi baru.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
