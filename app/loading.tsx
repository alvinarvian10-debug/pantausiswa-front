/**
 * Global loading boundary (App Router): ditampilkan otomatis saat
 * segmen mana pun sedang memuat di jaringan lambat.
 * Server Component — tanpa 'use client'.
 */
export default function GlobalLoading() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-content flex-1 flex-col items-center justify-center gap-4 p-8">
      <div
        role="status"
        aria-label="Memuat data..."
        className="flex flex-col items-center gap-4"
      >
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
        />
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Memuat data…
        </p>
        <div className="w-64 max-w-full space-y-2" aria-hidden="true">
          <div className="h-4 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
      </div>
    </main>
  );
}
