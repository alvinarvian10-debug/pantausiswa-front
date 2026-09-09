'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { hrefForBackendRole, loginToBackend } from '../../lib/api';
import { roleFromBackend, setSession } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    // Kredensial dicek ke backend NestJS (sysch/back) — bukan lagi Next API.
    // Peran akun otomatis terdeteksi dari backend, tanpa perlu memilih manual.
    setSaving(true);
    try {
      const data = await loginToBackend(identifier.trim(), password);
      // Cookie HttpOnly sudah dipasang server (route /api/auth/login).
      // Cache sesi untuk UI client.
      const frontRole = roleFromBackend(data.user.role);
      setSession({ role: frontRole, username: data.user.email });
      router.push(hrefForBackendRole(data.user.role));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Email atau password salah.',
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    'w-full rounded-xl border border-gray-200/90 bg-white/70 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-slate-50 p-4 py-12 text-gray-900">
      {/* Back link */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Kembali ke Beranda
      </Link>

      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] top-[15%] h-[30%] w-[30%] rounded-full bg-teal-100/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[15%] -left-[5%] h-[35%] w-[35%] rounded-full bg-blue-100/40 blur-3xl"
      />

      <main className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-glass-lg backdrop-blur-md md:p-10">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
              <span className="material-symbols-outlined icon-fill text-[36px]">school</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-gray-500">
              Masuk ke portal{' '}
              <span className="font-semibold text-emerald-600">PantauSiswa</span> Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">
                <span className="material-symbols-outlined icon-fill text-[18px]">error</span>
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="identifier">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                  person
                </span>
                <input
                  autoComplete="username"
                  className={inputClasses}
                  id="identifier"
                  name="identifier"
                  placeholder="nama@sekolah.sch.id"
                  required
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                  lock
                </span>
                <input
                  autoComplete="current-password"
                  className={`${inputClasses} pr-12`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-emerald-500 accent-emerald-500 focus:ring-emerald-500/40"
                    name="remember"
                  />
                  Ingat saya
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(true)}
                  className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  Lupa password?
                </button>
              </div>

              {showForgotNotice && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 ring-1 ring-inset ring-blue-100">
                  <span className="material-symbols-outlined icon-fill mt-0.5 text-[18px]">info</span>
                  <p>
                    Untuk reset password, silakan hubungi Admin sekolah — perubahan
                    password harus dikonfirmasi langsung oleh Admin demi keamanan akun.
                  </p>
                </div>
              )}
            </div>

            <button
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} PantauSiswa. Semua hak dilindungi.
        </p>
      </main>
    </div>
  );
}
