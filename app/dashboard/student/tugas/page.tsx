'use client';

import { useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_SISWA_ID, TipeSubmisi, Tugas, useAppData } from '../../../../lib/store';

export default function TugasPage() {
  const { tugas, submisi, getSiswa, submitTugas } = useAppData();
  const [activeTugas, setActiveTugas] = useState<Tugas | null>(null);
  const [tipe, setTipe] = useState<TipeSubmisi>('File');
  const [konten, setKonten] = useState('');
  const [namaFile, setNamaFile] = useState<string | null>(null);

  const me = getSiswa(CURRENT_SISWA_ID);

  const myTugas = useMemo(
    () => (me ? tugas.filter((t) => t.kelasId === me.kelasId) : []),
    [tugas, me],
  );

  const mySubmisi = useMemo(
    () => submisi.filter((s) => s.siswaId === CURRENT_SISWA_ID),
    [submisi],
  );

  const findSubmisi = (tugasId: string) => mySubmisi.find((s) => s.tugasId === tugasId);

  const isTerlambat = (deadline: string) => new Date(deadline) < new Date(new Date().toISOString().slice(0, 10));

  const stats = useMemo(() => {
    let aktif = 0, selesai = 0, lewat = 0;
    myTugas.forEach((t) => {
      const s = findSubmisi(t.id);
      if (s) selesai += 1;
      else if (isTerlambat(t.deadline)) lewat += 1;
      else aktif += 1;
    });
    return [
      { label: 'Tugas Aktif', count: aktif, chip: 'bg-yellow-50 text-yellow-600 ring-yellow-100', icon: 'assignment' },
      { label: 'Terkumpul', count: selesai, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: 'task_alt' },
      { label: 'Melewati Tenggat', count: lewat, chip: 'bg-red-50 text-red-600 ring-red-100', icon: 'event_busy' },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTugas, mySubmisi]);

  const openSubmit = (t: Tugas) => {
    setActiveTugas(t);
    setTipe('File');
    setKonten('');
    setNamaFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTugas) return;
    const finalKonten = tipe === 'Link' ? konten.trim() : tipe === 'File' ? (namaFile ?? '') : konten;
    if (!finalKonten) return;
    submitTugas({ tugasId: activeTugas.id, siswaId: CURRENT_SISWA_ID, tipe, konten: finalKonten });
    setActiveTugas(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (tipe === 'Foto') {
      const reader = new FileReader();
      reader.onload = () => setKonten(reader.result as string);
      reader.readAsDataURL(file);
      setNamaFile(file.name);
    } else {
      setNamaFile(file.name);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Tugas</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Lihat tugas dari guru, kumpulkan lewat foto, file, atau tautan
            eksternal, dan pantau nilainya di sini.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" aria-label="Ringkasan tugas" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex items-center gap-4 p-6">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${s.chip}`}>
              <span className="material-symbols-outlined icon-fill text-[24px]">{s.icon}</span>
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gray-900">{s.count}</span>
              <span className="text-sm font-medium text-gray-500">{s.label}</span>
            </div>
          </GlassCard>
        ))}
      </StaggerGroup>

      <ScrollReveal delay={0.1}>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Daftar Tugas</h2>
          <div className="flex flex-col gap-4">
            {myTugas.map((t) => {
              const s = findSubmisi(t.id);
              const terlambat = !s && isTerlambat(t.deadline);
              return (
                <GlassCard
                  key={t.id}
                  className="flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-700">{t.mapel}</span>
                      {t.lampiranNama && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-100">
                          <span className="material-symbols-outlined text-[12px]">attach_file</span>
                          {t.lampiranNama}
                        </span>
                      )}
                      {t.lampiranLink && (
                        <a
                          href={t.lampiranLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-inset ring-blue-100 hover:bg-blue-100"
                        >
                          <span className="material-symbols-outlined text-[12px]">link</span>
                          Lihat Referensi
                        </a>
                      )}
                    </div>
                    <p className="text-base font-semibold text-gray-900">{t.judul}</p>
                    <p className="text-sm text-gray-500">{t.deskripsi}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${terlambat ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}>
                        <span className="material-symbols-outlined icon-fill text-[14px]">schedule</span>
                        {t.deadline}
                      </span>
                      {s?.status === 'Dinilai' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          Nilai: {s.nilai}
                        </span>
                      )}
                    </div>
                    {s?.feedback && (
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-semibold">Feedback guru:</span> {s.feedback}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {!s && (
                      <button
                        type="button"
                        onClick={() => openSubmit(t)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] sm:w-auto"
                      >
                        <span className="material-symbols-outlined icon-fill text-[18px]">upload</span>
                        Kumpulkan Tugas
                      </button>
                    )}
                    {s?.status === 'Menunggu Nilai' && (
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-500 sm:w-auto">
                        <span className="material-symbols-outlined icon-fill text-[18px]">hourglass_top</span>
                        Menunggu Nilai
                      </span>
                    )}
                    {s?.status === 'Dinilai' && (
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100 sm:w-auto">
                        <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
                        Sudah Dinilai
                      </span>
                    )}
                  </div>
                </GlassCard>
              );
            })}
            {myTugas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
                Belum ada tugas untuk kelasmu.
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {activeTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900">Kumpulkan: {activeTugas.judul}</h2>
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-3 gap-2">
                {(['Foto', 'File', 'Link'] as TipeSubmisi[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipe(t); setKonten(''); setNamaFile(null); }}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                      tipe === t
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-100 bg-white text-gray-500 hover:border-emerald-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tipe === 'Link' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Tautan (Google Docs, Drive, dsb.)</label>
                  <input
                    type="url"
                    required
                    value={konten}
                    onChange={(e) => setKonten(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition-colors hover:border-emerald-300">
                  <input
                    type="file"
                    required
                    accept={tipe === 'Foto' ? 'image/*' : undefined}
                    className="hidden"
                    onChange={handleFile}
                  />
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                    <span className="material-symbols-outlined icon-fill text-[24px]">
                      {tipe === 'Foto' ? 'add_a_photo' : 'upload_file'}
                    </span>
                  </span>
                  <p className="text-sm font-medium text-gray-600">
                    {namaFile ?? `Pilih ${tipe === 'Foto' ? 'foto' : 'berkas'} untuk diunggah`}
                  </p>
                </label>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTugas(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Kumpulkan
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
