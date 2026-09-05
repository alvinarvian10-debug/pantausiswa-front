'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../components/GlassCard';
import ScrollReveal from '../../../components/ScrollReveal';
import { CURRENT_SEKRETARIS_ID, StatusPresensi, useAppData } from '../../../lib/store';

const STATUS: StatusPresensi[] = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
const BADGE: Record<StatusPresensi, string> = {
  Hadir: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Sakit: 'bg-amber-50 text-amber-700 ring-amber-100',
  Izin: 'bg-blue-50 text-blue-700 ring-blue-100',
  Alpa: 'bg-red-50 text-red-700 ring-red-100',
};

export default function SecretaryDashboard() {
  const { sekretaris, siswa, presensi, kelas, catatPresensi, getKelas } = useAppData();
  const [secretaryId, setSecretaryId] = useState(CURRENT_SEKRETARIS_ID);
  useEffect(() => {
    try {
      const session = JSON.parse(window.localStorage.getItem('pantausiswa.session') ?? '{}');
      if (session.secretaryId) setSecretaryId(session.secretaryId);
    } catch {}
  }, []);
  const account = sekretaris.find((a) => a.id === secretaryId);
  const myKelas = account ? getKelas(account.kelasId) : undefined;
  const members = useMemo(() => siswa.filter((s) => s.kelasId === account?.kelasId), [siswa, account?.kelasId]);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedStatus, setSelectedStatus] = useState<StatusPresensi>('Hadir');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [dbError, setDbError] = useState('');

  const filtered = members.filter((s) => `${s.nama} ${s.nis}`.toLowerCase().includes(query.trim().toLowerCase()));
  const statusFor = (id: string) => presensi.find((p) => p.siswaId === id && p.tanggal === today);

  const setAttendance = async (siswaId: string, status: StatusPresensi) => {
    setDbError('');
    try {
      const res = await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaId,
          tanggal: today,
          status,
          keterangan: `Dicatat oleh sekretaris ${myKelas?.nama ?? ''}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Gagal menyimpan ke database.');
      }
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Tersimpan lokal, tapi gagal masuk database: ${err.message}`
          : 'Tersimpan lokal, tapi gagal masuk database.',
      );
    }
    catatPresensi(secretaryId, { siswaId, status, keterangan: `Dicatat oleh sekretaris ${myKelas?.nama ?? ''}` });
    setMessage('Presensi berhasil diperbarui.');
    setTimeout(() => setMessage(''), 2000);
  };

  const counts = STATUS.reduce((acc, status) => {
    acc[status] = members.filter((s) => statusFor(s.id)?.status === status).length;
    return acc;
  }, {} as Record<StatusPresensi, number>);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Presensi Kelas</h1>
          <p className="text-sm leading-relaxed text-gray-500">Kelola kehadiran siswa {myKelas?.nama ?? '-'} sebagai sekretaris kelas.</p>
        </div>
      </ScrollReveal>

      {message && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">{message}</div>}
      {dbError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">{dbError}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUS.map((status) => (
          <GlassCard key={status} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{status}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{counts[status]}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daftar Siswa</h2>
            <p className="mt-1 text-xs text-gray-400">Tanggal {today} · hanya siswa dari kelas yang menjadi tanggung jawab akun ini.</p>
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / NIS..." className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 sm:w-64" />
        </div>

        <div className="flex flex-col divide-y divide-gray-100">
          {filtered.map((student) => {
            const current = statusFor(student.id);
            return (
              <div key={student.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{student.nama}</p>
                  <p className="text-xs text-gray-400">NIS {student.nis}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`mr-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${current ? BADGE[current.status] : 'bg-gray-50 text-gray-500 ring-gray-100'}`}>{current?.status ?? 'Belum dicatat'}</span>
                  {STATUS.map((status) => (
                    <button key={status} type="button" onClick={() => { setSelectedStatus(status); setAttendance(student.id, status); }} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selectedStatus === status ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>{status}</button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Siswa tidak ditemukan.</p>}
        </div>
      </GlassCard>
    </main>
  );
}
