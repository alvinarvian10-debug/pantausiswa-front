'use client';

import { useEffect, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import {
  apiCreatePasswordRequest,
  apiMyPasswordRequests,
} from '../../../../lib/api';
import { getSession } from '../../../../lib/auth';

export default function SecretaryPasswordPage() {
  const [email, setEmail] = useState('-');
  useEffect(() => {
    setEmail(getSession()?.username ?? '-');
  }, []);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const refreshPending = async () => {
    try {
      const list = await apiMyPasswordRequests();
      setPending(list.some((r) => r.status === 'MENUNGGU'));
    } catch {
      // backend tidak terjangkau — biarkan form tetap bisa dicoba
      setPending(false);
    }
  };

  useEffect(() => {
    refreshPending();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setIsError(true);
      return setMessage('Password minimal 6 karakter.');
    }
    if (password !== confirm) {
      setIsError(true);
      return setMessage('Konfirmasi password tidak cocok.');
    }
    try {
      await apiCreatePasswordRequest(password);
      setPassword('');
      setConfirm('');
      setIsError(false);
      setMessage('Permintaan ganti password dikirim. Tunggu konfirmasi admin.');
      await refreshPending();
    } catch (err) {
      setIsError(true);
      setMessage(
        err instanceof Error
          ? `Gagal mengirim permintaan: ${err.message}`
          : 'Gagal mengirim permintaan ke backend.',
      );
    }
  };

  return <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
    <ScrollReveal><div><h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Ganti Password</h1><p className="mt-2 text-sm text-gray-500">Perubahan password akun sekretaris harus dikonfirmasi oleh Admin.</p></div></ScrollReveal>
    <GlassCard className="max-w-2xl p-6">
      <div className="mb-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Akun</p><p className="mt-1 font-semibold text-gray-900">{email}</p></div>
      {message && <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}
      {pending && <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Permintaan sebelumnya masih menunggu konfirmasi Admin.</div>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input disabled={pending} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru" className="rounded-xl border border-slate-100 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50" />
        <input disabled={pending} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Konfirmasi password baru" className="rounded-xl border border-slate-100 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50" />
        <button disabled={pending} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300">Ajukan Perubahan</button>
      </form>
    </GlassCard>
  </main>;
}
