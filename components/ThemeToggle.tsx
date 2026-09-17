'use client';

import { useTheme } from './ThemeProvider';

/**
 * Mode tema berbentuk pil (light ↔ dark) dengan thumbnail yang meluncur
 * beranimasi halus. Ikon matahari/bulan silang-fade + rotasi di dalam thumb,
 * easing overshoot agar terasa "springy".
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={isDark ? 'Mode gelap aktif — klik untuk terang' : 'Mode terang aktif — klik untuk gelap'}
      onClick={toggle}
      className="relative flex h-9 w-[68px] shrink-0 cursor-pointer items-center rounded-full border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-md transition-colors duration-300 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-emerald-500/40"
    >
      {/* Track icons (menyorot sisi yang sedang "aktif") */}
      <span
        aria-hidden="true"
        className={`material-symbols-outlined absolute left-[7px] z-0 text-[15px] transition-opacity duration-300 ${
          isDark ? 'text-amber-300 opacity-100' : 'text-amber-500/40 opacity-50'
        }`}
      >
        light_mode
      </span>
      <span
        aria-hidden="true"
        className={`material-symbols-outlined absolute right-[8px] z-0 text-[15px] transition-opacity duration-300 ${
          isDark ? 'text-slate-500 opacity-40' : 'text-indigo-500 opacity-100'
        }`}
      >
        dark_mode
      </span>

      {/* Thumbnail yang meluncur */}
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? 'translate-x-8 bg-gradient-to-br from-slate-500 to-slate-700'
            : 'translate-x-0 bg-gradient-to-br from-amber-300 to-amber-500'
        }`}
      >
        <span
          className={`material-symbols-outlined icon-fill absolute text-[15px] text-white transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        >
          light_mode
        </span>
        <span
          className={`material-symbols-outlined icon-fill absolute text-[15px] text-slate-100 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        >
          dark_mode
        </span>
      </span>
    </button>
  );
}