'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import GlassCard from './GlassCard';
import Avatar from './Avatar';
import StaggerGroup from './StaggerGroup';

type RoleKey = 'student' | 'guru' | 'admin';

interface RoleContent {
  key: RoleKey;
  icon: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}

const ROLES: RoleContent[] = [
  {
    key: 'student',
    icon: 'backpack',
    label: 'Siswa',
    title: 'Presensi, izin, dan tugas — cukup dari satu layar',
    description:
      'Siswa check-in kehadiran, mengajukan izin, dan mengumpulkan tugas tanpa bolak-balik ke ruang guru.',
    bullets: [
      'Check-in kehadiran sekali ketuk',
      'Ajukan izin/sakit lengkap dengan lampiran',
      'Pantau tenggat tugas secara real-time',
    ],
  },
  {
    key: 'guru',
    icon: 'groups',
    label: 'Guru',
    title: 'Validasi kehadiran dan izin dalam hitungan detik',
    description:
      'Wali kelas melihat rekap kehadiran langsung dan menyetujui pengajuan izin tanpa berkas kertas.',
    bullets: [
      'Rekap kehadiran kelas real-time',
      'Setujui atau tolak izin langsung dari dashboard',
      'Tugas yang perlu dinilai terkumpul di satu tempat',
    ],
  },
  {
    key: 'admin',
    icon: 'admin_panel_settings',
    label: 'Admin',
    title: 'Satu dashboard untuk seluruh operasional sekolah',
    description:
      'Admin memantau tren kehadiran, tiket aduan, dan peminjaman fasilitas dalam satu tampilan analitik.',
    bullets: [
      'Analitik kehadiran seluruh sekolah',
      'Kelola tiket aduan dan inventaris fasilitas',
      'Data master siswa dan guru terpusat',
    ],
  },
];

const ACCENT: Record<
  RoleKey,
  {
    badge: string;
    iconChip: string;
    gradient: string;
    bar: string;
    dot: string;
    dotIcon: string;
  }
> = {
  student: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    iconChip: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
    gradient: 'from-emerald-400 to-emerald-600',
    bar: 'from-emerald-400 to-emerald-500',
    dot: 'bg-emerald-500 text-white',
    dotIcon: 'text-emerald-500',
  },
  guru: {
    badge: 'bg-teal-50 text-teal-700 ring-teal-100',
    iconChip: 'bg-teal-50 text-teal-500 ring-teal-100',
    gradient: 'from-teal-400 to-teal-600',
    bar: 'from-teal-400 to-teal-500',
    dot: 'bg-teal-500 text-white',
    dotIcon: 'text-teal-500',
  },
  admin: {
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    iconChip: 'bg-cyan-50 text-cyan-500 ring-cyan-100',
    gradient: 'from-cyan-400 to-cyan-600',
    bar: 'from-cyan-400 to-cyan-500',
    dot: 'bg-cyan-500 text-white',
    dotIcon: 'text-cyan-500',
  },
};

export default function RoleShowcase() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <StaticRoleShowcase />;
  }

  return <PinnedRoleShowcase />;
}

function PinnedRoleShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = latest < 1 / 3 ? 0 : latest < 2 / 3 ? 1 : 2;
    setActiveIndex((current) => (current === next ? current : next));
  });

  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section aria-label="Tiga peran, satu platform" className="relative">
      <div ref={containerRef} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-6 py-10 md:py-16">
          {/* Intro — stays fixed while panels rotate below it */}
          <div className="mx-auto mb-6 w-full max-w-2xl shrink-0 text-center md:mb-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
              Satu Platform, Tiga Peran
            </p>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Lihat Tampilan Setiap Peran
            </h2>
            <p className="hidden text-lg leading-relaxed text-gray-500 sm:block">
              Siswa, guru, dan admin masing-masing punya dashboard yang
              dirancang khusus untuk tugas harian mereka.
            </p>
          </div>

          {/* Rotating panels — only the active one is ever visible or interactive; the
              crossfade itself is a plain CSS transition triggered by `activeIndex`,
              not a scroll-scrubbed value, so there's no in-between window where two
              panels can render with simultaneous meaningful opacity. */}
          <div className="relative mx-auto w-full max-w-6xl flex-1">
            {ROLES.map((role, i) => (
              <div
                key={role.key}
                aria-hidden={activeIndex !== i}
                className={`absolute inset-0 flex items-center transition-all duration-500 ease-out ${
                  activeIndex === i
                    ? 'z-10 translate-y-0 opacity-100'
                    : 'pointer-events-none z-0 translate-y-4 opacity-0'
                }`}
              >
                <RolePanel role={role} />
              </div>
            ))}
          </div>

          {/* Scroll hint — only visible before the user starts moving through the section */}
          <motion.p
            aria-hidden="true"
            style={{ opacity: hintOpacity }}
            className="pointer-events-none mx-auto mt-3 flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-400"
          >
            <span className="material-symbols-outlined animate-bounce text-[16px]">
              keyboard_arrow_down
            </span>
            Gulir untuk jelajahi peran lainnya
          </motion.p>

          {/* Progress rail — decorative reinforcement, role name is already in each panel's heading */}
          <div
            aria-hidden="true"
            className="mx-auto mt-3 flex shrink-0 items-center gap-2"
          >
            {ROLES.map((role, i) => (
              <div
                key={role.key}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-transparent transition-colors duration-300 ${
                  activeIndex === i
                    ? ACCENT[role.key].dot
                    : 'bg-white/70 text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {role.icon}
                </span>
                {role.label}
              </div>
            ))}
          </div>

          {/* Continuous fill bar — the literal "animation keeps running as you scroll" cue */}
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-full max-w-xs shrink-0 overflow-hidden rounded-full bg-gray-100"
          >
            <motion.div
              style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RolePanel({ role }: { role: RoleContent }) {
  const accent = ACCENT[role.key];
  return (
    <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className="flex flex-col gap-5">
        <span
          className={`inline-flex w-max items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${accent.badge}`}
        >
          <span className="material-symbols-outlined icon-fill text-[18px]">
            {role.icon}
          </span>
          Portal {role.label}
        </span>
        <h3 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
          {role.title}
        </h3>
        <p className="max-w-md text-base leading-relaxed text-gray-500">
          {role.description}
        </p>
        <ul className="mt-2 flex flex-col gap-3">
          {role.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2.5 text-sm font-medium text-gray-700"
            >
              <span className="material-symbols-outlined icon-fill mt-0.5 text-[18px] text-emerald-500">
                check_circle
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <RoleMockup role={role} />
    </div>
  );
}

function RoleMockup({ role }: { role: RoleContent }) {
  const accent = ACCENT[role.key];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden="true"
        className={`absolute -inset-6 rounded-[2rem] bg-gradient-to-br ${accent.gradient} opacity-[0.08] blur-2xl`}
      />
      <GlassCard
        className="relative p-5 shadow-glass-lg"
        aria-hidden="true"
      >
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>

        {role.key === 'student' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="material-symbols-outlined icon-fill text-[16px] text-emerald-500">
                  task_alt
                </span>
                Status Hari Ini
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-100">
                Hadir
              </span>
            </div>
            {[
              { s: 'Matematika — Aljabar', d: '2 Hari' },
              { s: 'B. Inggris — Essay', d: 'Besok' },
            ].map((t) => (
              <div
                key={t.s}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-gray-900">
                    {t.s}
                  </span>
                  <span className="whitespace-nowrap rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                    {t.d}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {role.key === 'guru' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  Kehadiran Kelas
                </span>
                <span className="text-sm font-bold text-gray-900">32/35</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                  style={{ width: '91%' }}
                />
              </div>
            </div>
            {[
              { n: 'Ahmad Faisal', t: 'Sakit', tone: 'slate' as const },
              { n: 'Siti Nurhaliza', t: 'Izin', tone: 'blue' as const },
            ].map((r) => (
              <div
                key={r.n}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm"
              >
                <Avatar name={r.n} tone={r.tone} className="h-8 w-8 text-[10px]" />
                <span className="flex-1 truncate text-xs font-medium text-gray-700">
                  {r.n}
                </span>
                <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {r.t}
                </span>
              </div>
            ))}
          </div>
        )}

        {role.key === 'admin' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: '95%', c: 'bg-emerald-500' },
                { v: '850', c: 'bg-teal-500' },
                { v: '24', c: 'bg-cyan-500' },
              ].map((chip) => (
                <div
                  key={chip.v}
                  className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm"
                >
                  <div className={`mb-1.5 h-1.5 w-6 rounded-full ${chip.c}`} />
                  <p className="text-sm font-bold text-gray-900">{chip.v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="flex h-16 items-end justify-between gap-2">
                {[60, 78, 85, 70, 92].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-full rounded-t-md ${
                      i === 4 ? 'bg-cyan-500' : 'bg-cyan-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/** `prefers-reduced-motion` fallback — same content, no pin/scroll-linked transforms. */
function StaticRoleShowcase() {
  return (
    <section
      aria-label="Tiga peran, satu platform"
      className="px-6 py-24"
    >
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Satu Platform, Tiga Peran
        </p>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Dirancang untuk Setiap Peran
        </h2>
        <p className="text-lg leading-relaxed text-gray-500">
          Siswa, guru, dan admin masing-masing punya dashboard yang dirancang
          khusus untuk tugas harian mereka.
        </p>
      </div>

      <StaggerGroup
        className="mx-auto flex max-w-6xl flex-col gap-16"
        itemClassName=""
      >
        {ROLES.map((role) => (
          <div key={role.key} className="w-full">
            <RolePanel role={role} />
          </div>
        ))}
      </StaggerGroup>
    </section>
  );
}
