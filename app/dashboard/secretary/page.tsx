'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../components/GlassCard';
import ScrollReveal from '../../../components/ScrollReveal';
import {
  apiCatatPresensi,
  apiRekapPresensi,
  type BackendRekapRow,
} from '../../../lib/api';
import { CURRENT_SEKRETARIS_ID, StatusPresensi, useAppData } from '../../../lib/store';

const STATUS: StatusPresensi[] = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
const BADGE: Record<string, string> = {
  Hadir: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Terlambat: 'bg-orange-50 text-orange-700 ring-orange-100',
  Sakit: 'bg-amber-50 text-amber-700 ring-amber-100',
  Izin: 'bg-blue-50 text-blue-700 ring-blue-100',
  Alpa: 'bg-red-50 text-red-700 ring-red-100',
};

const kapital = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

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
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [dbError, setDbError] = useState('');

  // Sumber kebenaran: rekap backend (lingkup kelas sendiri) bila terjangkau.
  const [beRekap, setBeRekap] = useState<BackendRekapRow[] | null>(null);

  const muatRekap = async () => {
    try {
      setBeRekap(await apiRekapPresensi({ tanggal: today }));
    } catch {
      setBeRekap(null);
    }
  };

  useEffect(() => {
    muatRekap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useBackend = beRekap !== null;
  const kelasNama = useBackend
    ? (beRekap[0]?.kelas ?? myKelas?.nama ?? '-')
    : (myKelas?.nama ?? '-');

  const statusLokal = (id: string) =>
    presensi.find((p) => p.siswaId === id && p.tanggal === today)?.status;

  const setAttendance = async (siswaKey: string | number, status: StatusPresensi) => {
    setDbError('');
    if (useBackend && typeof siswaKey === 'number') {
      try {
        await apiCatatPresensi({
          siswaId: siswaKey,
          status,
          tanggal: today,
          catatan: `Dicatat oleh sekretaris ${kelasNama}`,
        });
        await muatRekap();
        setMessage('Presensi berhasil diperbarui di backend.');
        setTimeout(() => setMessage(''), 2000);
      } catch (err) {
        setDbError(
          err instanceof Error
            ? `Gagal masuk backend: ${err.message}`
            : 'Gagal masuk backend.',
        );
      }
      return;
    }
    // Fallback lokal (backend tak terjangkau / data lokal lama).
    catatPresensi(secretaryId, { siswaId: String(siswaKey), status, keterangan: `Dicatat oleh sekretaris ${myKelas?.nama ?? ''}` });
    setMessage('Presensi berhasil diperbarui (lokal).');
    setTimeout(() => setMessage(''), 2000);
  };

  const barisBackend = useMemo(() => {
    if (!beRekap) return [];
    const q = query.trim().toLowerCase();
    return beRekap.filter((r) => !q || `${r.nama} ${r.nis}`.toLowerCase().includes(q));
  }, [beRekap, query]);

  const filtered = members.filter((s) => `${s.nama} ${s.nis}`.toLowerCase().includes(query.trim().toLowerCase()));

  const counts: Record<string, number> = useMemo(() => {
    const acc: Record<string, number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    if (useBackend) {
      for (const r of beRekap ?? []) {
        const label = r.sudahCheckIn ? kapital(r.status) : 'Belum';
        if (label in acc) acc[label] += 1;
      }
      return acc;
    }
    for (const s of members) {
      const st = statusLokal(s.id);
      if (st && st in acc) acc[st] += 1;
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beRekap, useBackend, members, presensi]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Presensi Kelas</h1>
          <p className="text-sm leading-relaxed text-gray-500">Kelola kehadiran siswa {kelasNama} sebagai sekretaris kelas.</p>
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

        {useBackend ? (
          <div className="flex flex-col divide-y divide-gray-100">
            {barisBackend.map((row) => {
              const label = row.sudahCheckIn ? kapital(row.status) : 'Belum dicatat';
              return (
                <div key={row.siswaId} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{row.nama}</p>
                    <p className="text-xs text-gray-400">NIS {row.nis}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`mr-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${BADGE[label] ?? 'bg-gray-50 text-gray-500 ring-gray-100'}`}>{label}</span>
                    {STATUS.map((status) => (
                      <button key={status} type="button" onClick={() => setAttendance(row.siswaId, status)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${label === status ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>{status}</button>
                    ))}
                  </div>
                </div>
              );
            })}
            {barisBackend.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Siswa tidak ditemukan.</p>}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {filtered.map((student) => {
              const current = statusLokal(student.id);
              return (
                <div key={student.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{student.nama}</p>
                    <p className="text-xs text-gray-400">NIS {student.nis}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`mr-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${current ? BADGE[current] : 'bg-gray-50 text-gray-500 ring-gray-100'}`}>{current ?? 'Belum dicatat'}</span>
                    {STATUS.map((status) => (
                      <button key={status} type="button" onClick={() => setAttendance(student.id, status)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${current === status ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>{status}</button>
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Siswa tidak ditemukan.</p>}
          </div>
        )}
      </GlassCard>
    </main>
  );
}
