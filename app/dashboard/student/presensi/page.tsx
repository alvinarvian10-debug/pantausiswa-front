'use client';

import { useEffect, useMemo, useState } from 'react';

interface AttendanceRecord {
  id: string;
  date: string; // e.g., "28 Agustus 2026"
  time: string; // e.g., "06:45 WIB"
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  notes: string;
}

const ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'A-001',
    date: '28 Agustus 2026',
    time: '06:45 WIB',
    status: 'Hadir',
    notes: 'Presensi kedatangan melalui fingerprint.',
  },
  {
    id: 'A-002',
    date: '27 Agustus 2026',
    time: '06:52 WIB',
    status: 'Hadir',
    notes: 'Presensi kedatangan melalui fingerprint.',
  },
  {
    id: 'A-003',
    date: '26 Agustus 2026',
    time: '07:05 WIB',
    status: 'Izin',
    notes: 'Izin keperluan keluarga, dilampirkan surat orang tua.',
  },
  {
    id: 'A-004',
    date: '25 Agustus 2026',
    time: '06:48 WIB',
    status: 'Hadir',
    notes: 'Presensi kedatangan melalui fingerprint.',
  },
  {
    id: 'A-005',
    date: '24 Agustus 2026',
    time: '08:10 WIB',
    status: 'Sakit',
    notes: 'Surat keterangan dokter telah diunggah.',
  },
];

const KPI = [
  {
    icon: 'person_check',
    count: 18,
    label: 'Hadir Bulan Ini',
    iconChip: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    icon: 'sick',
    count: 1,
    label: 'Sakit Bulan Ini',
    iconChip: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  {
    icon: 'description',
    count: 2,
    label: 'Izin Bulan Ini',
    iconChip: 'bg-blue-50 text-blue-600 ring-blue-100',
  },
  {
    icon: 'cancel',
    count: 0,
    label: 'Tanpa Keterangan',
    iconChip: 'bg-red-50 text-red-600 ring-red-100',
  },
];

const STATUS_BADGE: Record<AttendanceRecord['status'], string> = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-blue-100 text-blue-700',
  Alpa: 'bg-red-100 text-red-700',
};

export default function PresensiPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setNow(new Date());
  }, []);

  const formattedDate = useMemo(() => {
    if (!now) return 'Memuat…';
    return now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  }, [now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ATTENDANCE;
    return ATTENDANCE.filter(
      (r) =>
        r.date.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      {/* ============ Heading ============ */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Presensi &amp; Izin
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          Lakukan check-in harian, ajukan izin atau sakit, dan pantau riwayat
          kehadiranmu dalam satu halaman.
        </p>
      </div>

      {/* ============ KPI Cards ============ */}
      <section
        aria-label="Ringkasan kehadiran"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {KPI.map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${kpi.iconChip}`}
            >
              <span className="material-symbols-outlined icon-fill text-[24px]">
                {kpi.icon}
              </span>
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {kpi.count}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {kpi.label}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ============ Quick Actions ============ */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Check-In */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Presensi Hari Ini
          </h2>
          <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>

          {checkedIn ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <span className="material-symbols-outlined icon-fill text-[22px]">
                task_alt
              </span>
              Kamu telah check-in hari ini. Semangat belajar!
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCheckedIn(true)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97]"
            >
              Check-in Sekarang
            </button>
          )}
        </div>

        {/* Leave Request */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Butuh Dispensasi?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ajukan surat izin atau keterangan sakit dengan melampirkan dokumen.
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl border-2 border-emerald-600 py-3 font-medium text-emerald-600 transition-all duration-200 hover:bg-emerald-50 active:scale-[0.97] active:bg-emerald-50"
          >
            Buat Pengajuan
          </button>
        </div>
      </section>

      {/* ============ History Table ============ */}
      <section className="flex flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Riwayat Kehadiran Terbaru
          </h2>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tanggal, status, keterangan…"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Waktu</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {record.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                    {record.time}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[record.status]}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{record.notes}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    Tidak ada catatan kehadiran yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
