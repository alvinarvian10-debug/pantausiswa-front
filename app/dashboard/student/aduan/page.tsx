'use client';

import { useMemo, useState } from 'react';

interface Complaint {
  id: string;
  title: string;
  category: 'Fasilitas' | 'Akademik' | 'Keamanan & Bullying' | 'Lainnya';
  date: string;
  isAnonymous: boolean;
  status: 'Diproses' | 'Selesai' | 'Ditolak';
  description: string;
  adminResponse?: string;
}

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'AD-001',
    title: 'AC Ruang Kelas 4 Tidak Dingin',
    category: 'Fasilitas',
    date: '24 Agustus 2026',
    isAnonymous: false,
    status: 'Diproses',
    description:
      'AC di ruang kelas 4 sejak seminggu terakhir tidak lagi dingin sehingga suhu kelas terasa panas saat jam pelajaran siang.',
  },
  {
    id: 'AD-002',
    title: 'Bully di Antrean Kantin',
    category: 'Keamanan & Bullying',
    date: '20 Agustus 2026',
    isAnonymous: true,
    status: 'Selesai',
    description:
      'Terjadi pembullyan saat antrean kantin oleh siswa kelas atas terhadap adik kelas. Sudi kiranya ditindak lanjuti.',
    adminResponse:
      'Terima kasih atas laporannya. Guru BK telah memanggil pihak terkait dan memberikan pembinaan. Pengawasan kantin saat istirahat telah diperketat.',
  },
  {
    id: 'AD-003',
    title: 'Nilai UTS Belum Terinput',
    category: 'Akademik',
    date: '18 Agustus 2026',
    isAnonymous: false,
    status: 'Selesai',
    description:
      'Nilai UTS Matematika saya belum muncul di portal padahal teman lain sudah menerima. Mohon diperiksa kembali.',
    adminResponse:
      'Nilai telah diverifikasi ulang oleh wali kelas dan sudah terinput dengan benar. Mohon dicek kembali pada menu tugas.',
  },
  {
    id: 'AD-004',
    title: 'Lampu Toilet Lantai 2 Mati',
    category: 'Fasilitas',
    date: '15 Agustus 2026',
    isAnonymous: true,
    status: 'Ditolak',
    description:
      'Beberapa lampu di toilet lantai 2 mati total sehingga gelap saat digunakan malam hari.',
    adminResponse:
      'Laporan ditolak karena berdasarkan pengecekan satpam, lampu dalam kondisi menyala. Mohon lampirkan foto jika masih terjadi.',
  },
];

const CATEGORY_OPTIONS: Complaint['category'][] = [
  'Fasilitas',
  'Akademik',
  'Keamanan & Bullying',
  'Lainnya',
];

const STATUS_STYLE: Record<Complaint['status'], string> = {
  Diproses: 'bg-amber-50 text-amber-700 ring-amber-100',
  Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-700 ring-red-100',
};

const CATEGORY_STYLE: Record<Complaint['category'], string> = {
  Fasilitas: 'bg-blue-50 text-blue-700 ring-blue-100',
  Akademik: 'bg-purple-50 text-purple-700 ring-purple-100',
  'Keamanan & Bullying': 'bg-rose-50 text-rose-700 ring-rose-100',
  Lainnya: 'bg-slate-50 text-slate-600 ring-slate-100',
};

const FILTERS = ['Semua', 'Diproses', 'Selesai'] as const;

export default function AduanPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [openForm, setOpenForm] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Fasilitas' as Complaint['category'],
    description: '',
    isAnonymous: false,
  });

  const stats = useMemo(() => {
    const total = complaints.length;
    const diproses = complaints.filter((c) => c.status === 'Diproses').length;
    const selesai = complaints.filter((c) => c.status === 'Selesai').length;
    return [
      { label: 'Total Aduan', count: total, chip: 'bg-blue-50 text-blue-600 ring-blue-100', icon: 'forum' },
      { label: 'Dalam Proses', count: diproses, chip: 'bg-amber-50 text-amber-600 ring-amber-100', icon: 'hourglass_top' },
      { label: 'Selesai Ditangani', count: selesai, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: 'task_alt' },
    ];
  }, [complaints]);

  const visible = useMemo(() => {
    if (filter === 'Semua') return complaints;
    return complaints.filter((c) => c.status === filter);
  }, [complaints, filter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);

    setTimeout(() => {
      const newComplaint: Complaint = {
        id: `AD-${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Jakarta',
        }),
        isAnonymous: form.isAnonymous,
        status: 'Diproses',
        description: form.description.trim(),
      };
      setComplaints((prev) => [newComplaint, ...prev]);
      setSubmitting(false);
      setOpenForm(false);
      setSuccess(true);
      setForm({ title: '', category: 'Fasilitas', description: '', isAnonymous: false });
      setTimeout(() => setSuccess(false), 4000);
    }, 1000);
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Aduan &amp; Pengaduan
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          Laporkan kendala fasilitas sekolah atau masalah administrasi melalui
          sistem ticketing yang cepat dan transparan.
        </p>
      </div>

      {/* KPI + CTA */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${s.chip}`}
              >
                <span className="material-symbols-outlined icon-fill text-[24px]">
                  {s.icon}
                </span>
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {s.count}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setOpenForm((v) => !v)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] lg:w-auto"
          >
            <span className="material-symbols-outlined icon-fill text-[20px]">
              add_comment
            </span>
            {openForm ? 'Tutup Form' : 'Buat Aduan Baru'}
          </button>
        </div>
      </section>

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <span className="material-symbols-outlined icon-fill text-[22px]">
            check_circle
          </span>
          Aduan Anda berhasil dikirim dan sedang ditinjau.
        </div>
      )}

      {/* Complaint Form */}
      {openForm && (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Buat Aduan Baru
          </h2>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Judul Aduan
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Contoh: AC ruang kelas rusak"
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as Complaint['category'],
                  }))
                }
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Deskripsi Detail
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                placeholder="Jelaskan kendala atau masalah yang ingin Anda laporkan secara lengkap…"
                className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAnonymous: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Kirim secara Anonim — Identitas Anda tidak akan terlihat oleh
                publik
              </span>
            </label>

            {/* Mock Upload */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition-colors hover:border-emerald-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                <span className="material-symbols-outlined icon-fill text-[24px]">
                  add_a_photo
                </span>
              </span>
              <p className="text-sm font-medium text-gray-600">
                Unggah foto bukti jika ada
              </p>
              <p className="text-xs text-gray-400">
                Tarik &amp; lepas berkas di sini, atau klik untuk memilih
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-emerald-500/70 disabled:active:scale-100"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined icon-fill animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Mengirimkan aduan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined icon-fill text-[18px]">
                    send
                  </span>
                  Kirim Aduan Sekarang
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* History & Status Tracker */}
      <section className="flex flex-col">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {visible.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${CATEGORY_STYLE[c.category]}`}
                >
                  {c.category}
                </span>
                {c.isAnonymous && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span className="material-symbols-outlined icon-fill text-[14px]">
                      visibility_off
                    </span>
                    Anonim
                  </span>
                )}
                <span className="text-xs text-gray-400">{c.date}</span>
                <span
                  className={`ml-auto inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[c.status]}`}
                >
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900">
                {c.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {c.description}
              </p>

              {c.adminResponse && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-relaxed text-emerald-800">
                  <span className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="material-symbols-outlined icon-fill text-[18px]">
                      forum
                    </span>
                    Tanggapan Pihak Sekolah:
                  </span>
                  {c.adminResponse}
                </div>
              )}
            </article>
          ))}
          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
              Tidak ada aduan pada filter ini.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
