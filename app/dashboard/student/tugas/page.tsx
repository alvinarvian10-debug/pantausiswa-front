'use client';

import { useMemo, useState } from 'react';

interface Task {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  status: 'Menunggu' | 'Selesai' | 'Terlambat';
  type: 'Essay' | 'Pilihan Ganda' | 'Proyek';
}

const TASKS: Task[] = [
  {
    id: 'T-001',
    subject: 'Matematika',
    title: 'Latihan Soal Aljabar Halaman 45–50',
    deadline: '28 Agustus 2026',
    status: 'Menunggu',
    type: 'Essay',
  },
  {
    id: 'T-002',
    subject: 'Bahasa Inggris',
    title: 'Essay "My Future Career" (500 kata)',
    deadline: '29 Agustus 2026',
    status: 'Menunggu',
    type: 'Essay',
  },
  {
    id: 'T-003',
    subject: 'Fisika',
    title: 'Kuis Pilihan Ganda Bab 3',
    deadline: '30 Agustus 2026',
    status: 'Menunggu',
    type: 'Pilihan Ganda',
  },
  {
    id: 'T-004',
    subject: 'Sejarah',
    title: 'Presentasi Proyek Kemerdekaan',
    deadline: '02 September 2026',
    status: 'Selesai',
    type: 'Proyek',
  },
  {
    id: 'T-005',
    subject: 'Biologi',
    title: 'Laporan Praktikum Mikroskop',
    deadline: '25 Agustus 2026',
    status: 'Terlambat',
    type: 'Proyek',
  },
];

const STATUS_STYLE: Record<Task['status'], string> = {
  Menunggu: 'bg-amber-50 text-amber-700 ring-amber-100',
  Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Terlambat: 'bg-red-50 text-red-700 ring-red-100',
};

const TYPE_STYLE: Record<Task['type'], string> = {
  Essay: 'bg-blue-50 text-blue-700 ring-blue-100',
  'Pilihan Ganda': 'bg-purple-50 text-purple-700 ring-purple-100',
  Proyek: 'bg-teal-50 text-teal-700 ring-teal-100',
};

function deadlineTone(status: Task['status']): string {
  if (status === 'Terlambat') return 'bg-red-50 text-red-700 ring-red-100';
  if (status === 'Menunggu') return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-slate-50 text-slate-500 ring-slate-100';
}

export default function TugasPage() {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);

  const handleMockUpload = (taskId: string) => {
    if (uploadingId) return;
    setUploadingId(taskId);
    setTimeout(() => {
      setUploadingId(null);
      setCompletedUploads((prev) => [...prev, taskId]);
    }, 1500);
  };

  const stats = useMemo(() => {
    const aktif = TASKS.filter((t) => t.status === 'Menunggu').length;
    const selesai = TASKS.filter((t) => t.status === 'Selesai').length;
    const lewat = TASKS.filter((t) => t.status === 'Terlambat').length;
    return [
      { label: 'Tugas Aktif', count: aktif, tone: 'text-yellow-600', chip: 'bg-yellow-50 text-yellow-600 ring-yellow-100', icon: 'assignment' },
      { label: 'Selesai', count: selesai, tone: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: 'task_alt' },
      { label: 'Melewati Tenggat', count: lewat, tone: 'text-red-600', chip: 'bg-red-50 text-red-600 ring-red-100', icon: 'event_busy' },
    ];
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Tugas
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          Lihat daftar tugas aktif, unggah pekerjaanmu, dan pantau tenggat waktu
          dari setiap mata pelajaran.
        </p>
      </div>

      {/* KPI Header */}
      <section
        aria-label="Ringkasan tugas"
        className="grid grid-cols-1 gap-6 sm:grid-cols-3"
      >
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
      </section>

      {/* Split Layout */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main: Daftar Tugas */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Daftar Tugas
          </h2>
          <div className="flex flex-col gap-4">
            {TASKS.map((task) => {
              const isUploading = uploadingId === task.id;
              const isCompleted = completedUploads.includes(task.id);
              const showUpload =
                task.status === 'Menunggu' && !isCompleted && !isUploading;

              return (
                <article
                  key={task.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-700">
                        {task.subject}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TYPE_STYLE[task.type]}`}
                      >
                        {task.type}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-gray-900">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${deadlineTone(task.status)}`}
                      >
                        <span className="material-symbols-outlined icon-fill text-[14px]">
                          schedule
                        </span>
                        {task.deadline}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {showUpload && (
                      <button
                        type="button"
                        onClick={() => handleMockUpload(task.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] sm:w-auto"
                      >
                        <span className="material-symbols-outlined icon-fill text-[18px]">
                          upload
                        </span>
                        Upload Jawaban
                      </button>
                    )}
                    {isUploading && (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-emerald-500/70 px-5 py-2.5 text-sm font-medium text-white sm:w-auto"
                      >
                        <span className="material-symbols-outlined icon-fill animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Mengunggah...
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 sm:w-auto"
                      >
                        <span className="material-symbols-outlined icon-fill text-[18px]">
                          check_circle
                        </span>
                        Terkumpul
                      </button>
                    )}
                    {task.status !== 'Menunggu' && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 ring-1 ring-inset ring-slate-100">
                        <span className="material-symbols-outlined icon-fill text-[18px]">
                          {task.status === 'Selesai' ? 'check_circle' : 'block'}
                        </span>
                        {task.status === 'Selesai' ? 'Terkumpul' : 'Ditutup'}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Jadwal Mendatang */}
        <aside className="lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Jadwal Mendatang
          </h2>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Tenggat 7 Hari Ke Depan
            </p>
            <ol className="flex flex-col gap-5">
              {TASKS.filter((t) => t.status === 'Menunggu').map((task, i, arr) => (
                <li key={task.id} className="relative flex gap-4 pl-1">
                  <div className="relative flex flex-col items-center">
                    <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    {i < arr.length - 1 && (
                      <span className="absolute top-4 h-full w-px bg-slate-100" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col pb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {task.subject}
                    </span>
                    <span className="text-xs text-gray-500">{task.title}</span>
                    <span className="mt-1 inline-flex w-max items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                      {task.deadline}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>
    </main>
  );
}
