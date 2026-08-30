'use client';

import { useMemo, useState } from 'react';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { useAppData } from '../../../../lib/store';

type Tab = 'siswa' | 'guru' | 'kelas';

export default function MasterDataPage() {
  const { siswa, guru, kelas } = useAppData();
  const [tab, setTab] = useState<Tab>('siswa');
  const [query, setQuery] = useState('');

  const filteredSiswa = useMemo(
    () => siswa.filter((s) => s.nama.toLowerCase().includes(query.toLowerCase()) || s.nis.includes(query)),
    [siswa, query],
  );
  const filteredGuru = useMemo(
    () => guru.filter((g) => g.nama.toLowerCase().includes(query.toLowerCase())),
    [guru, query],
  );

  const kelasCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    siswa.forEach((s) => { map[s.kelasId] = (map[s.kelasId] ?? 0) + 1; });
    return map;
  }, [siswa]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Master Data</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Pusat data siswa, guru, dan kelas — sumber data yang sama dipakai
            oleh seluruh fitur di portal siswa dan guru.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">school</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{siswa.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Siswa</span>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">groups</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{guru.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Guru</span>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
            <span className="material-symbols-outlined icon-fill text-[24px]">meeting_room</span>
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{kelas.length}</span>
            <span className="text-sm font-medium text-gray-500">Total Kelas</span>
          </div>
        </GlassCard>
      </StaggerGroup>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 border-b border-slate-100">
          {([
            { key: 'siswa', label: 'Siswa', icon: 'school' },
            { key: 'guru', label: 'Guru', icon: 'groups' },
            { key: 'kelas', label: 'Kelas', icon: 'meeting_room' },
          ] as { key: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="material-symbols-outlined icon-fill text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'kelas' && (
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau NIS…"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        )}
      </div>

      {tab === 'siswa' && (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">NIS</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.nama} tone={s.tone} className="h-9 w-9 text-xs" />
                        <span className="font-medium text-gray-900">{s.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{s.nis}</td>
                    <td className="px-6 py-4 text-gray-500">{kelas.find((k) => k.id === s.kelasId)?.nama ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}

      {tab === 'guru' && (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                  <th className="px-6 py-4 font-semibold">Wali Kelas</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuru.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={g.nama} tone={g.tone} className="h-9 w-9 text-xs" />
                        <span className="font-medium text-gray-900">{g.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{g.mapel.join(', ')}</td>
                    <td className="px-6 py-4 text-gray-500">{kelas.find((k) => k.id === g.waliKelasId)?.nama ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}

      {tab === 'kelas' && (
        <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kelas.map((k) => (
            <GlassCard key={k.id} className="p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                <span className="material-symbols-outlined icon-fill text-[22px]">meeting_room</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{k.nama}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Wali Kelas: {guru.find((g) => g.id === k.waliKelasId)?.nama ?? '-'}
              </p>
              <p className="mt-1 text-sm text-gray-500">{kelasCountMap[k.id] ?? 0} siswa</p>
            </GlassCard>
          ))}
        </StaggerGroup>
      )}
    </main>
  );
}
