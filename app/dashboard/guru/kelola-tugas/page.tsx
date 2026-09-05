'use client';

import { useMemo, useState } from 'react';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { CURRENT_GURU_ID, SubmisiTugas, useAppData } from '../../../../lib/store';

type Tab = 'beri' | 'cek';

export default function KelolaTugasPage() {
  const { kelas, guru, tugas, submisi, siswa, getSiswa, buatTugas, nilaiSubmisi, tambahRiwayatGuru } = useAppData();
  const [activeKelasId, setActiveKelasId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('beri');
  const [gradeTarget, setGradeTarget] = useState<SubmisiTugas | null>(null);
  const [nilai, setNilai] = useState('');
  const [feedback, setFeedback] = useState('');
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  const me = guru.find((g) => g.id === CURRENT_GURU_ID);
  const myKelas = useMemo(() => kelas.filter((k) => k.waliKelasId === CURRENT_GURU_ID), [kelas]);
  const activeKelas = myKelas.find((k) => k.id === activeKelasId) ?? myKelas[0] ?? null;

  const kelasTugas = useMemo(
    () => (activeKelas ? tugas.filter((t) => t.kelasId === activeKelas.id && t.guruId === CURRENT_GURU_ID) : []),
    [tugas, activeKelas],
  );

  const [form, setForm] = useState({
    mapel: me?.mapel[0] ?? '',
    judul: '',
    deskripsi: '',
    deadline: new Date().toISOString().slice(0, 10),
    lampiranNama: null as string | null,
    lampiranLink: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKelas || !form.judul.trim() || !form.deskripsi.trim() || saving) return;
    setSaving(true);
    setDbError('');
    setDbNotice('');
    const payload = {
      guruId: CURRENT_GURU_ID,
      kelasId: activeKelas.id,
      mapel: form.mapel,
      judul: form.judul.trim(),
      deskripsi: form.deskripsi.trim(),
      lampiranNama: form.lampiranNama,
      lampiranLink: form.lampiranLink.trim() || null,
      deadline: form.deadline,
    };
    // Simpan ke MySQL dulu — pakai id DB sebagai id lokal agar link submisi cocok.
    let dbId: string | undefined;
    try {
      const res = await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Gagal menyimpan ke database.');
      }
      const saved = await res.json().catch(() => null);
      if (saved?.id) dbId = String(saved.id);
      setDbNotice('Tugas tersimpan di database XAMPP.');
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Tersimpan lokal, tapi gagal masuk database: ${err.message}`
          : 'Tersimpan lokal, tapi gagal masuk database.',
      );
    }
    buatTugas(dbId ? { ...payload, id: dbId } : payload);
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Membuat tugas', `Membuat tugas baru "${form.judul.trim()}" untuk kelas ${activeKelas.nama}`);
    setForm({ mapel: me?.mapel[0] ?? '', judul: '', deskripsi: '', deadline: new Date().toISOString().slice(0, 10), lampiranNama: null, lampiranLink: '' });
    setSaving(false);
  };

  const kelasSiswaIds = useMemo(
    () => (activeKelas ? siswa.filter((s) => s.kelasId === activeKelas.id).map((s) => s.id) : []),
    [siswa, activeKelas],
  );

  const submissionsByTugas = useMemo(() => {
    return kelasTugas.map((t) => ({
      tugas: t,
      submisiList: submisi.filter((s) => s.tugasId === t.id && kelasSiswaIds.includes(s.siswaId)),
      totalSiswa: kelasSiswaIds.length,
    }));
  }, [kelasTugas, submisi, kelasSiswaIds]);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget || nilai === '' || saving) return;
    const target = gradeTarget;
    const n = Math.max(0, Math.min(100, Number(nilai)));
    const fb = feedback.trim();
    setSaving(true);
    setDbError('');
    setDbNotice('');
    nilaiSubmisi(target.id, n, fb);
    const s = getSiswa(target.siswaId);
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Menilai tugas', `Memberi nilai ${n} untuk tugas milik ${s?.nama ?? '-'}`);
    // Sinkron nilai ke MySQL; data lama (id SB-xx) dicocokkan via tugas+siswa.
    try {
      const resPatch = await fetch(`/api/submisi/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nilai: n, feedback: fb }),
      });
      if (!resPatch.ok) {
        const errBody = await resPatch.json().catch(() => null);
        if (resPatch.status === 404 || errBody?.code === 'NOT_FOUND') {
          const listRes = await fetch('/api/submisi');
          const list = listRes.ok ? await listRes.json().catch(() => null) : null;
          const match = Array.isArray(list)
            ? list.find(
                (r: { id?: string; tugasId?: string; siswaId?: string }) =>
                  r.tugasId === target.tugasId && r.siswaId === target.siswaId,
              )
            : null;
          if (match?.id) {
            const resRetry = await fetch(`/api/submisi/${match.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nilai: n, feedback: fb }),
            });
            if (!resRetry.ok) throw new Error('Gagal update baris DB yang cocok.');
          } else {
            throw new Error('Pengumpulan ini belum ada di database. Minta siswa kumpulkan ulang.');
          }
        } else {
          throw new Error(errBody?.error ?? 'Gagal update database.');
        }
      }
      setDbNotice(`Nilai ${n} tersimpan di database XAMPP.`);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Nilai lokal tersimpan, tapi gagal masuk database: ${err.message}`
          : 'Nilai lokal tersimpan, tapi gagal masuk database.',
      );
    } finally {
      setSaving(false);
      setGradeTarget(null);
      setNilai('');
      setFeedback('');
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Kelola Tugas</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Berikan tugas baru ke kelasmu dan nilai pengumpulan siswa dari satu tempat.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <div className="flex flex-wrap gap-3">
          {myKelas.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setActiveKelasId(k.id)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                activeKelas?.id === k.id
                  ? 'bg-emerald-600 text-white shadow-cta'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {k.nama}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {dbNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          {dbNotice}
        </div>
      )}
      {dbError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">error</span>
          {dbError}
        </div>
      )}

      {activeKelas && (
        <>
          <div className="flex gap-2 border-b border-slate-100">
            {([
              { key: 'beri', label: 'Beri Tugas', icon: 'add_task' },
              { key: 'cek', label: 'Cek Pengumpulan', icon: 'fact_check' },
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

          {tab === 'beri' && (
            <ScrollReveal delay={0.1}>
              <GlassCard className="p-6">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">Tugas Baru untuk {activeKelas.nama}</h2>
                <form className="flex flex-col gap-5" onSubmit={handleCreate}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
                      <select
                        value={form.mapel}
                        onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
                        className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      >
                        {(me?.mapel ?? ['Umum']).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Tenggat Waktu</label>
                      <input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Judul Tugas</label>
                    <input
                      type="text"
                      required
                      value={form.judul}
                      onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                      placeholder="Contoh: Latihan Soal Trigonometri"
                      className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Instruksi</label>
                    <textarea
                      required
                      value={form.deskripsi}
                      onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                      rows={3}
                      placeholder="Jelaskan instruksi pengerjaan tugas…"
                      className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-emerald-300">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setForm((f) => ({ ...f, lampiranNama: e.target.files?.[0]?.name ?? null }))}
                      />
                      <span className="material-symbols-outlined icon-fill text-[22px] text-emerald-600">upload_file</span>
                      <p className="text-xs font-medium text-gray-600">{form.lampiranNama ?? 'Lampirkan gambar/berkas (opsional)'}</p>
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Tautan Referensi (opsional)</label>
                      <input
                        type="url"
                        value={form.lampiranLink}
                        onChange={(e) => setForm((f) => ({ ...f, lampiranLink: e.target.value }))}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-emerald-500/70 sm:w-auto"
                  >
                    <span className="material-symbols-outlined icon-fill text-[18px]">send</span>
                    {saving ? 'Menyimpan...' : 'Berikan Tugas'}
                  </button>
                </form>
              </GlassCard>

              {kelasTugas.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Tugas yang Sudah Diberikan</h3>
                  <StaggerGroup key={activeKelas.id} as="div" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {kelasTugas.map((t) => (
                      <GlassCard key={t.id} className="p-5">
                        <span className="text-xs font-semibold text-emerald-700">{t.mapel}</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{t.judul}</p>
                        <p className="mt-1 text-xs text-gray-500">Tenggat: {t.deadline}</p>
                      </GlassCard>
                    ))}
                  </StaggerGroup>
                </div>
              )}
            </ScrollReveal>
          )}

          {tab === 'cek' && (
            <ScrollReveal delay={0.1}>
              <div className="flex flex-col gap-6">
                {submissionsByTugas.map(({ tugas: t, submisiList, totalSiswa }) => (
                  <GlassCard key={t.id} className="p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-emerald-700">{t.mapel}</span>
                        <h3 className="text-base font-semibold text-gray-900">{t.judul}</h3>
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-100">
                        {submisiList.length} / {totalSiswa} terkumpul
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {submisiList.map((s) => {
                        const student = getSiswa(s.siswaId);
                        return (
                          <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar name={student?.nama ?? '?'} tone={student?.tone} className="h-9 w-9 text-xs" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{student?.nama}</p>
                                <p className="text-xs text-gray-500">
                                  {s.tipe === 'Link' ? (
                                    <a href={s.konten} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat tautan</a>
                                  ) : s.tipe === 'Foto' ? (
                                    'Foto terlampir'
                                  ) : (
                                    s.konten
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {s.status === 'Dinilai' ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                  Nilai: {s.nilai}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setGradeTarget(s); setNilai(''); setFeedback(''); }}
                                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                                >
                                  Beri Nilai
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {submisiList.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-400">Belum ada siswa yang mengumpulkan.</p>
                      )}
                    </div>
                  </GlassCard>
                ))}
                {submissionsByTugas.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
                    Belum ada tugas yang diberikan untuk kelas ini.
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </>
      )}

      {gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-sm overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Nilai Tugas — {getSiswa(gradeTarget.siswaId)?.nama}
            </h2>
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleGrade}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Nilai (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Feedback (opsional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGradeTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
