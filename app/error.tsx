'use client';

import { useEffect } from 'react';
import GlassCard from '../components/GlassCard';

/**
 * Global error boundary (App Router): menangkap crash render/data di
 * segmen mana pun dan memberi jalan pulih tanpa reload manual.
 * WAJIB Client Component ('use client') karena memakai `reset()`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Satu-satunya efek samping: catat ke konsol untuk diagnostik.
    // (Ganti dengan reporter eksternal bila tersedia.)
    // eslint-disable-next-line no-console
    console.error('[PantauSiswa] route error:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-content flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
      <GlassCard className="flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
        >
          <span className="material-symbols-outlined icon-fill text-[28px]">
            error
          </span>
        </span>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          Terjadi kesalahan
        </h1>
        <p
          role="alert"
          className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-slate-400"
        >
          Maaf, halaman ini gagal dimuat. Coba muat ulang — data Anda yang
          sudah tersimpan tidak hilang.
        </p>
        {error?.digest && (
          <p className="font-mono text-xs text-gray-400 dark:text-slate-500">
            Kode: {error.digest}
          </p>
        )}
        <div className="mt-2 flex w-full gap-3">
          <a
            href="/"
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Ke Beranda
          </a>
          <button
            type="button"
            onClick={() => reset()}
            autoFocus
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
          >
            Coba Lagi
          </button>
        </div>
      </GlassCard>
    </main>
  );
}
