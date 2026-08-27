'use client';

import { Role, getRoleUser } from './Sidebar';
import Avatar from './Avatar';

interface TopHeaderProps {
  role: Role;
  onMenuClick: () => void;
}

const HEADER_META: Record<Role, { title: string; subtitle: string }> = {
  student: { title: 'Selamat Datang, Ahmad Fauzi', subtitle: 'Semangat belajar hari ini!' },
  guru: { title: 'Dashboard Guru', subtitle: 'Kelola kelas dan pengajaran Anda' },
  admin: { title: 'Dashboard Admin', subtitle: 'Ringkasan operasional sekolah' },
};

export default function TopHeader({ role, onMenuClick }: TopHeaderProps) {
  const meta = HEADER_META[role];
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between gap-4 border-b border-white/60 bg-white/70 px-4 shadow-sm backdrop-blur-md sm:px-8">
      {/* Left: mobile menu + title / search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-900 md:hidden"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="min-w-0 flex-1 md:flex-none">
          <h2 className="truncate text-lg font-semibold leading-tight text-gray-900 md:text-xl">
            <span className="md:hidden">{getRoleUser(role).name}</span>
            <span className="hidden md:inline">{meta.title}</span>
          </h2>
          <p className="hidden truncate text-sm text-gray-500 md:block">{meta.subtitle}</p>
        </div>

        {role === 'admin' && (
          <div className="relative ml-auto hidden w-full max-w-md lg:block">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
              search
            </span>
            <input
              aria-label="Cari data"
              className="w-full rounded-full border border-gray-200/80 bg-white/60 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Cari data siswa, fasilitas..."
              type="text"
            />
          </div>
        )}
      </div>

      {/* Right: date, notifications, avatar */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <span className="mr-1 hidden items-center gap-1.5 text-sm font-medium text-gray-500 xl:flex">
          <span className="material-symbols-outlined text-[18px] text-emerald-500">today</span>
          {today}
        </span>

        <button
          aria-label="Notifikasi"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/80 hover:text-emerald-600"
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
          />
        </button>

        <div className="ml-1 flex items-center gap-3 rounded-full bg-white/60 py-1 pl-1 pr-1 ring-1 ring-white/60 sm:pr-4">
          <Avatar name={getRoleUser(role).name} className="h-9 w-9 text-xs" />
          <span className="hidden text-sm font-semibold text-gray-900 sm:block">
            {getRoleUser(role).name}
          </span>
        </div>
      </div>
    </header>
  );
}
