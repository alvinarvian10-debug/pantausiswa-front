'use client';

import { useMemo, useState } from 'react';

interface Facility {
  id: string;
  name: string;
  category: 'Ruangan' | 'Elektronik' | 'Olahraga';
  available: number;
  icon: string;
}

interface ActiveLoan {
  id: string;
  item: string;
  returnTime: string;
  status: 'Dipinjam' | 'Terlambat';
}

const FACILITIES: Facility[] = [
  { id: 'F-001', name: 'Proyektor Mini', category: 'Elektronik', available: 2, icon: 'videocam' },
  { id: 'F-002', name: 'Ruang Lab Komputer', category: 'Ruangan', available: 1, icon: 'computer' },
  { id: 'F-003', name: 'Bola Basket', category: 'Olahraga', available: 5, icon: 'sports_basketball' },
  { id: 'F-004', name: 'Ruang Rapat', category: 'Ruangan', available: 3, icon: 'meeting_room' },
  { id: 'F-005', name: 'Speaker Portable', category: 'Elektronik', available: 4, icon: 'speaker' },
  { id: 'F-006', name: 'Net Voli', category: 'Olahraga', available: 2, icon: 'sports_volleyball' },
];

const ACTIVE_LOAN: ActiveLoan = {
  id: 'L-001',
  item: 'Proyektor Mini',
  returnTime: '16:00 WIB hari ini',
  status: 'Dipinjam',
};

const CATEGORIES = ['Semua', 'Ruangan', 'Elektronik', 'Olahraga'] as const;

const CATEGORY_CHIP: Record<Facility['category'], string> = {
  Ruangan: 'bg-blue-50 text-blue-700 ring-blue-100',
  Elektronik: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Olahraga: 'bg-orange-50 text-orange-700 ring-orange-100',
};

export default function PeminjamanPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Semua');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACILITIES.filter((f) => {
      const matchCat = category === 'Semua' || f.category === category;
      const matchQuery = !q || f.name.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [query, category]);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Peminjaman Fasilitas
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          Pinjam ruangan, peralatan elektronik, dan fasilitas olahraga sekolah
          tanpa repot dan bebas bentrok jadwal.
        </p>
      </div>

      {/* Active Loan Banner */}
      <section
        className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          ACTIVE_LOAN.status === 'Terlambat'
            ? 'border-red-200 bg-red-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <div className="flex items-center gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
              ACTIVE_LOAN.status === 'Terlambat'
                ? 'bg-white text-red-600 ring-red-100'
                : 'bg-white text-emerald-600 ring-emerald-100'
            }`}
          >
            <span className="material-symbols-outlined icon-fill text-[26px]">
              {ACTIVE_LOAN.status === 'Terlambat' ? 'priority_high' : 'inventory_2'}
            </span>
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              Sedang Dipinjam: {ACTIVE_LOAN.item}
            </span>
            <span className="text-xs font-medium text-gray-500">
              Status: {ACTIVE_LOAN.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px] text-emerald-600">
            schedule
          </span>
          <span className="text-sm font-bold text-gray-900">
            Batas Kembali: {ACTIVE_LOAN.returnTime}
          </span>
        </div>
      </section>

      {/* Search + Filter */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined icon-fill pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari fasilitas…"
            className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                category === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Facility Catalog Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((facility) => (
          <article
            key={facility.id}
            className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <span className="material-symbols-outlined icon-fill text-[32px]">
                {facility.icon}
              </span>
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900">
                {facility.name}
              </h3>
              <span
                className={`mx-auto inline-flex w-max rounded-full px-3 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CATEGORY_CHIP[facility.category]}`}
              >
                {facility.category}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Tersedia:{' '}
              <span className="font-bold text-gray-900">{facility.available}</span>
            </p>
            <button
              type="button"
              className="mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97]"
            >
              Ajukan Pinjaman
            </button>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
            Tidak ada fasilitas yang cocok dengan pencarian.
          </div>
        )}
      </section>
    </main>
  );
}
