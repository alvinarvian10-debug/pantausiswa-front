'use client';

import { useEffect, useMemo, useState } from 'react';
import Avatar from '../../../../components/Avatar';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import {
  apiCreateTugas,
  apiGetSubmissions,
  apiGradeSubmission,
  apiListKelas,
  apiListMapel,
  apiListTugas,
  type BackendSubmission,
  type BackendTugas,
} from '../../../../lib/api';
import { CURRENT_GURU_ID, SubmisiTugas, useAppData, type AvatarTone } from '../../../../lib/store';

type Tab = 'beri' | 'cek';

export default function KelolaTugasPage() {
  const { kelas, guru, tugas, submisi, siswa, getSiswa, buatTugas, nilaiSubmisi, tambahRiwayatGuru } = useAppData();
  const [tab, setTab] = useState<Tab>('beri');
  const [gradeTarget, setGradeTarget] = useState<{
    key: string;
    backendSubId: number | null;
    tugasBackendId: number | null;
    lokal?: SubmisiTugas;
    nama: string;
  } | null>(null);
  const [nilai, setNilai] = useState('');
  const [feedback, setFeedback] = useState('');
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  const me = guru.find((g) => g.id === CURRENT_GURU_ID);

  // Sumber kebenaran: backend bila terjangkau (tugas milik guru + pengumpulan),
  // lokal bila tidak.
  const [beTugas, setBeTugas] = useState<BackendTugas[] | null>(null);
  const [beSubs, setBeSubs] = useState<Record<number, BackendSubmission[]>>({});

  const muatBackend = async () => {
    try {
      const list = await apiListTugas();
      setBeTugas(list);
      const entries = await Promise.all(
        list.map(async (t) => {
          try {
            return [t.id, await apiGetSubmissions(t.id)] as const;
          } catch {
            return [t.id, []] as const;
          }
        }),
      );
      setBeSubs(Object.fromEntries(entries));
    } catch {
      setBeTugas(null);
      setBeSubs({});
    }
  };

  const muatSubsTugas = async (tugasId: number) => {
    try {
      const list = await apiGetSubmissions(tugasId);
      setBeSubs((prev) => ({ ...prev, [tugasId]: list }));
    } catch {
      // biarkan data lama tampil
    }
  };

  useEffect(() => {
    muatBackend();
  }, []);

  const useBackend = beTugas !== null;

  const myKelas = useMemo(() => kelas.filter((k) => k.waliKelasId === CURRENT_GURU_ID), [kelas]);
  // Tab = nama kelas (dari backend bila tersedia, else lokal).
  const tabNames: string[] = useMemo(
    () =>
      useBackend
        ? [...new Set(beTugas.map((t) => t.kelas?.nama ?? '-'))]
        : myKelas.map((k) => k.nama),
    [useBackend, beTugas, myKelas],
  );
  const [activeTabState, setActiveTabState] = useState<string | null>(null);
  const activeTab = activeTabState ?? tabNames[0] ?? null;
  const activeKelas = myKelas.find((k) => k.nama === activeTab) ?? myKelas[0] ?? null;

  interface BarisTugasGuru {
    key: string;
    backendId: number | null;
    mapel: string;
    judul: string;
    deadline: string;
  }

  const kelasTugas: BarisTugasGuru[] = useMemo(() => {
    if (useBackend) {
      return beTugas
        .filter((t) => (t.kelas?.nama ?? '-') === activeTab)
        .map((t) => ({
          key: `be-${t.id}`,
          backendId: t.id,
          mapel: t.mapel?.nama ?? '-',
          judul: t.judul,
          deadline: t.tenggat.slice(0, 10),
        }));
    }
    if (!activeKelas) return [];
    return tugas
      .filter((t) => t.kelasId === activeKelas.id && t.guruId === CURRENT_GURU_ID)
      .map((t) => ({
        key: `lokal-${t.id}`,
        backendId: null,
        mapel: t.mapel,
        judul: t.judul,
        deadline: t.deadline,
      }));
  }, [useBackend, beTugas, activeTab, tugas, activeKelas]);

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
    if (!form.judul.trim() || !form.deskripsi.trim() || saving) return;
    setSaving(true);
    setDbError('');
    setDbNotice('');
    // Mode backend: cocokkan nama mapel & nama tab kelas ke id numerik.
    if (useBackend) {
      if (!activeTab) {
        setSaving(false);
        return;
      }
      try {
        const [mapels, kelases] = await Promise.all([
          apiListMapel(),
          apiListKelas(),
        ]);
        const mapelMatch = mapels.find(
          (m) => m.nama.toLowerCase() === form.mapel.trim().toLowerCase(),
        );
        if (!mapelMatch) {
          throw new Error(
            `Mapel "${form.mapel}" tidak ada di backend. Minta admin daftarkan dulu.`,
          );
        }
        const kelasMatch = kelases.find(
          (k) => k.nama.toLowerCase() === activeTab.trim().toLowerCase(),
        );
        if (!kelasMatch) {
          throw new Error(`Kelas "${activeTab}" tidak ada di backend.`);
        }
        await apiCreateTugas({
          judul: form.judul.trim(),
          deskripsi: form.deskripsi.trim(),
          mapelId: mapelMatch.id,
          kelasId: kelasMatch.id,
          tenggat: form.deadline,
          ...(form.lampiranLink.trim()
            ? { lampiranUrl: form.lampiranLink.trim() }
            : {}),
        });
        tambahRiwayatGuru(CURRENT_GURU_ID, 'Membuat tugas', `Membuat tugas baru "${form.judul.trim()}" untuk kelas ${activeTab}`);
        await muatBackend();
        setDbNotice('Tugas tersimpan di backend.');
        setForm({ mapel: me?.mapel[0] ?? '', judul: '', deskripsi: '', deadline: new Date().toISOString().slice(0, 10), lampiranNama: null, lampiranLink: '' });
      } catch (err) {
        setDbError(
          err instanceof Error
            ? `Gagal masuk backend: ${err.message}`
            : 'Gagal masuk backend.',
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!activeKelas) {
      setSaving(false);
      return;
    }
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
    // Simpan ke backend NestJS dulu — backend butuh mapelId & kelasId
    // numerik, jadi cocokkan nama ke daftar backend. Pakai id backend
    // sebagai id lokal agar link submisi cocok.
    let dbId: string | undefined;
    try {
      const [mapels, kelases] = await Promise.all([
        apiListMapel(),
        apiListKelas(),
      ]);
      const mapelMatch = mapels.find(
        (m) => m.nama.toLowerCase() === form.mapel.trim().toLowerCase(),
      );
      if (!mapelMatch) {
        throw new Error(
          `Mapel "${form.mapel}" tidak ada di backend. Minta admin daftarkan dulu.`,
        );
      }
      const kelasMatch = kelases.find(
        (k) => k.nama.toLowerCase() === activeKelas.nama.trim().toLowerCase(),
      );
      if (!kelasMatch) {
        throw new Error(
          `Kelas "${activeKelas.nama}" tidak ada di backend. Sinkronkan master data dulu.`,
        );
      }
      const saved = await apiCreateTugas({
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        mapelId: mapelMatch.id,
        kelasId: kelasMatch.id,
        tenggat: form.deadline,
        ...(form.lampiranLink.trim()
          ? { lampiranUrl: form.lampiranLink.trim() }
          : {}),
      });
      if (saved?.id != null) dbId = String(saved.id);
      setDbNotice('Tugas tersimpan di backend.');
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Tersimpan lokal, tapi gagal masuk backend: ${err.message}`
          : 'Tersimpan lokal, tapi gagal masuk backend.',
      );
    }
    buatTugas(dbId ? { ...payload, id: dbId } : payload);
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Membuat tugas', `Membuat tugas baru "${form.judul.trim()}" untuk kelas ${activeKelas.nama}`);
    setForm({ mapel: me?.mapel[0] ?? '', judul: '', deskripsi: '', deadline: new Date().toISOString().slice(0, 10), lampiranNama: null, lampiranLink: '' });
    setSaving(false);
  };

  interface BarisSubmisi {
    key: string;
    backendSubId: number | null;
    tugasBackendId: number | null;
    lokal?: SubmisiTugas;
    nama: string;
    tone?: AvatarTone;
    konten: string;
    isLink: boolean;
    dinilai: boolean;
    nilai: number | null;
  }

  const submissionsByTugas = useMemo(() => {
    if (useBackend) {
      return kelasTugas.map((t) => {
        const list = t.backendId !== null ? (beSubs[t.backendId] ?? []) : [];
        return {
          tugas: t,
          submisiList: list.map(
            (s): BarisSubmisi => ({
              key: `be-${s.id}`,
              backendSubId: s.id,
              tugasBackendId: t.backendId,
              nama: s.siswa?.user?.nama ?? '-',
              tone: undefined,
              konten: s.fileUrl,
              isLink: s.fileUrl.startsWith('http'),
              dinilai: s.nilai !== null && s.nilai !== undefined,
              nilai: s.nilai,
            }),
          ),
          totalSiswa: null as number | null,
        };
      });
    }
    const kelasSiswaIds = activeKelas
      ? siswa.filter((s) => s.kelasId === activeKelas.id).map((s) => s.id)
      : [];
    return kelasTugas.map((t) => {
      const localId = t.key.replace(/^lokal-/, '');
      const list = submisi.filter(
        (s) => s.tugasId === localId && kelasSiswaIds.includes(s.siswaId),
      );
      return {
        tugas: t,
        submisiList: list.map(
          (s): BarisSubmisi => {
            const student = getSiswa(s.siswaId);
            return {
              key: `lokal-${s.id}`,
              backendSubId: Number.isInteger(Number(s.id)) ? Number(s.id) : null,
              tugasBackendId: null,
              lokal: s,
              nama: student?.nama ?? '-',
              tone: student?.tone,
              konten: s.konten,
              isLink: s.tipe === 'Link',
              dinilai: s.status === 'Dinilai',
              nilai: s.nilai,
            };
          },
        ),
        totalSiswa: kelasSiswaIds.length as number | null,
      };
    });
  }, [useBackend, kelasTugas, beSubs, submisi, siswa, activeKelas, getSiswa]);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget || nilai === '' || saving) return;
    const target = gradeTarget;
    const n = Math.max(0, Math.min(100, Number(nilai)));
    const fb = feedback.trim();
    setSaving(true);
    setDbError('');
    setDbNotice('');
    if (target.backendSubId !== null) {
      tambahRiwayatGuru(CURRENT_GURU_ID, 'Menilai tugas', `Memberi nilai ${n} untuk tugas milik ${target.nama}`);
      try {
        await apiGradeSubmission(target.backendSubId, { nilai: n, feedback: fb });
        if (target.tugasBackendId !== null) await muatSubsTugas(target.tugasBackendId);
        setDbNotice(`Nilai ${n} tersimpan di backend.`);
      } catch (err) {
        setDbError(
          err instanceof Error
            ? `Gagal masuk backend: ${err.message}`
            : 'Gagal masuk backend.',
        );
      } finally {
        setSaving(false);
        setGradeTarget(null);
        setNilai('');
        setFeedback('');
      }
      return;
    }
    // Fallback lokal.
    const req = target.lokal!;
    nilaiSubmisi(req.id, n, fb);
    const s = getSiswa(req.siswaId);
    tambahRiwayatGuru(CURRENT_GURU_ID, 'Menilai tugas', `Memberi nilai ${n} untuk tugas milik ${s?.nama ?? '-'}`);
    try {
      const numericSubId = Number(req.id);
      if (!Number.isInteger(numericSubId)) {
        throw new Error(
          'Pengumpulan ini belum ada di backend (id lokal lama). Minta siswa kumpulkan ulang.',
        );
      }
      await apiGradeSubmission(numericSubId, { nilai: n, feedback: fb });
      setDbNotice(`Nilai ${n} tersimpan di backend.`);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Nilai lokal tersimpan, tapi gagal masuk backend: ${err.message}`
          : 'Nilai lokal tersimpan, tapi gagal masuk backend.',
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
          {tabNames.map((nama) => (
            <button
              key={nama}
              type="button"
              onClick={() => setActiveTabState(nama)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                activeTab === nama
                  ? 'bg-emerald-600 text-white shadow-cta'
                  : 'bg-white text-gray-600 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {nama}
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

      {activeTab && (
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
                <h2 className="mb-5 text-lg font-semibold text-gray-900">Tugas Baru untuk {activeTab}</h2>
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
                  <StaggerGroup key={activeTab} as="div" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {kelasTugas.map((t) => (
                      <GlassCard key={t.key} className="p-5">
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
                  <GlassCard key={t.key} className="p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-emerald-700">{t.mapel}</span>
                        <h3 className="text-base font-semibold text-gray-900">{t.judul}</h3>
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-100">
                        {totalSiswa === null
                          ? `${submisiList.length} terkumpul`
                          : `${submisiList.length} / ${totalSiswa} terkumpul`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {submisiList.map((s) => {
                        return (
                          <div key={s.key} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar name={s.nama} tone={s.tone} className="h-9 w-9 text-xs" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{s.nama}</p>
                                <p className="text-xs text-gray-500">
                                  {s.isLink ? (
                                    <a href={s.konten} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat tautan</a>
                                  ) : (
                                    s.konten
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {s.dinilai ? (
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
              Nilai Tugas — {gradeTarget.nama}
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
