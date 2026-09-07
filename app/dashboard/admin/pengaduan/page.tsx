'use client';

import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import StaggerGroup from '../../../../components/StaggerGroup';
import { apiListAduan, apiUpdateAduan, toBackendStatusAduan, type BackendAduan } from '../../../../lib/api';
import { Aduan, useAppData } from '../../../../lib/store';

const STATUS_STYLE: Record<string, string> = {
  Baru: 'bg-blue-50 text-blue-700 ring-blue-100',
  Proses: 'bg-amber-50 text-amber-700 ring-amber-100',
  Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Ditolak: 'bg-red-50 text-red-600 ring-red-100',
};

const FILTERS = ['Semua', 'Fasilitas', 'Keluhan'] as const;

export default function LaporanAduanPage() {
  const { aduan, getSiswa, getFasilitas, siklusStatusAduan, tanggapiAduan } = useAppData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua');
  const [responTarget, setResponTarget] = useState<BarisAduan | null>(null);
  const [tanggapan, setTanggapan] = useState('');
  const [dbNotice, setDbNotice] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sumber kebenaran: backend bila terjangkau, lokal bila tidak.
  const [beAduan, setBeAduan] = useState<BackendAduan[] | null>(null);

  const muatBackend = async () => {
    try {
      const res = await apiListAduan();
      setBeAduan(res.data);
    } catch {
      setBeAduan(null);
    }
  };

  useEffect(() => {
    muatBackend();
  }, []);

  interface BarisAduan {
    key: string;
    backendId: number | null;
    lokal?: Aduan;
    namaPelapor: string;
    anonim: boolean;
    subPelapor: string;
    jenis: 'Fasilitas' | 'Keluhan';
    judul: string;
    deskripsi: string;
    fasilitasNama: string | null;
    status: string;
    tanggapan: string | null;
  }

  const barisSemua: BarisAduan[] = useMemo(() => {
    if (beAduan !== null) {
      const keDepan: Record<string, string> = {
        BARU: 'Baru',
        DIPROSES: 'Proses',
        SELESAI: 'Selesai',
        DITOLAK: 'Ditolak',
      };
      return beAduan.map((a) => ({
        key: `be-${a.id}`,
        backendId: a.id,
        // Backend menyamarkan nama bila anonim (pelapor null).
        namaPelapor: a.pelapor?.nama ?? 'Anonim',
        anonim: a.isAnonim,
        subPelapor: `${a.pelapor?.nama ?? 'Anonim'} · ${(a.createdAt ?? '').slice(0, 10)}`,
        jenis: (a.kategori === 'FASILITAS' ? 'Fasilitas' : 'Keluhan') as 'Fasilitas' | 'Keluhan',
        judul: a.judul,
        deskripsi: a.deskripsi,
        fasilitasNama: null,
        status: keDepan[a.status] ?? a.status,
        tanggapan: a.tanggapan,
      }));
    }
    return aduan.map((a) => {
      const pelapor = a.isAnonim ? 'Anonim' : (getSiswa(a.siswaId)?.nama ?? '-');
      return {
        key: `lokal-${a.id}`,
        backendId: Number.isInteger(Number(a.id)) ? Number(a.id) : null,
        lokal: a,
        namaPelapor: pelapor,
        anonim: a.isAnonim,
        subPelapor: `Oleh ${pelapor} · ${a.tanggal}`,
        jenis: a.jenis,
        judul: a.judul,
        deskripsi: a.deskripsi,
        fasilitasNama: a.fasilitasId ? (getFasilitas(a.fasilitasId)?.nama ?? null) : null,
        status: a.status,
        tanggapan: a.tanggapan,
      };
    });
  }, [beAduan, aduan, getSiswa, getFasilitas]);

  // PATCH ke backend: PATCH /aduan/:id (admin). Id lokal lama (AD-xx)
  // belum ada di backend — lokal tetap diupdate, pesan menjelaskan.
  const syncKeDB = async (a: Aduan, patch: { status?: string; tanggapan?: string }) => {
    const numericId = Number(a.id);
    if (!Number.isInteger(numericId)) {
      throw new Error(
        'Data lokal lama belum ada di backend (id non-numerik). Minta pelapor buat ulang.',
      );
    }
    await apiUpdateAduan(numericId, {
      ...(patch.status ? { status: toBackendStatusAduan(patch.status) } : {}),
      ...(patch.tanggapan ? { tanggapan: patch.tanggapan } : {}),
    });
  };

  const visible = useMemo(() => {
    if (filter === 'Semua') return barisSemua;
    return barisSemua.filter((a) => a.jenis === filter);
  }, [barisSemua, filter]);

  const stats = useMemo(() => {
    const baru = barisSemua.filter((a) => a.status === 'Baru').length;
    const proses = barisSemua.filter((a) => a.status === 'Proses').length;
    const selesai = barisSemua.filter((a) => a.status === 'Selesai').length;
    return [
      { label: 'Aduan Baru', count: baru, chip: 'bg-blue-50 text-blue-600 ring-blue-100', icon: 'markunread' },
      { label: 'Dalam Proses', count: proses, chip: 'bg-amber-50 text-amber-600 ring-amber-100', icon: 'hourglass_top' },
      { label: 'Selesai', count: selesai, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: 'task_alt' },
    ];
  }, [barisSemua]);

  const handleRespon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responTarget || !tanggapan.trim() || saving) return;
    const target = responTarget;
    const teks = tanggapan.trim();
    setSaving(true);
    setDbError('');
    setDbNotice('');
    if (target.backendId !== null) {
      try {
        await apiUpdateAduan(target.backendId, { tanggapan: teks });
        await muatBackend();
        setDbNotice('Tanggapan tersimpan di backend.');
      } catch (err) {
        setDbError(
          err instanceof Error
            ? `Gagal masuk backend: ${err.message}`
            : 'Gagal masuk backend.',
        );
      } finally {
        setSaving(false);
        setResponTarget(null);
        setTanggapan('');
      }
      return;
    }
    tanggapiAduan(target.lokal!.id, teks);
    try {
      await syncKeDB(target.lokal!, { tanggapan: teks });
      setDbNotice('Tanggapan tersimpan di backend.');
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Tersimpan lokal, tapi gagal masuk backend: ${err.message}`
          : 'Tersimpan lokal, tapi gagal masuk backend.',
      );
    } finally {
      setSaving(false);
      setResponTarget(null);
      setTanggapan('');
    }
  };

  const STATUS_BE: Record<string, string> = {
    Baru: 'BARU',
    Proses: 'DIPROSES',
    Selesai: 'SELESAI',
  };

  const handleStatusMaju = async (a: BarisAduan) => {
    if (saving) return;
    const next = a.status === 'Baru' ? 'Proses' : 'Selesai';
    if (a.backendId !== null) {
      setSaving(true);
      setDbError('');
      setDbNotice('');
      try {
        await apiUpdateAduan(a.backendId, { status: STATUS_BE[next] ?? next });
        await muatBackend();
        setDbNotice(`Status "${a.judul}" → ${next}, tersimpan di backend.`);
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
    siklusStatusAduan(a.lokal!.id);
    setDbError('');
    setDbNotice('');
    try {
      await syncKeDB(a.lokal!, { status: next });
      setDbNotice(`Status "${a.judul}" → ${next}, tersimpan di backend.`);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? `Status lokal berubah, tapi gagal masuk backend: ${err.message}`
          : 'Status lokal berubah, tapi gagal masuk backend.',
      );
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Laporan Aduan</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Kelola aduan kerusakan fasilitas dan keluh kesah siswa. Klik badge
            status untuk memajukan penanganan: Baru → Proses → Selesai.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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

      <div className="flex flex-wrap items-center gap-2">
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

      <StaggerGroup key={filter} as="div" className="flex flex-col gap-4">
        {visible.map((a) => {
          return (
            <GlassCard key={a.key} className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-100">
                  {a.jenis === 'Fasilitas' ? 'Fasilitas Rusak' : 'Keluh Kesah'}
                </span>
                {a.anonim && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span className="material-symbols-outlined icon-fill text-[14px]">visibility_off</span>
                    Anonim
                  </span>
                )}
                <span className="text-xs text-gray-400">{a.subPelapor}</span>
                <button
                  type="button"
                  onClick={() => handleStatusMaju(a)}
                  disabled={a.status === 'Selesai'}
                  title={a.status === 'Selesai' ? 'Sudah selesai' : 'Klik untuk memajukan status'}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-transform active:scale-95 ${STATUS_STYLE[a.status]} ${a.status !== 'Selesai' ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}
                >
                  {a.status}
                  {a.status !== 'Selesai' && <span className="material-symbols-outlined text-[14px]">arrow_forward</span>}
                </button>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{a.judul}</h3>
              {a.fasilitasNama && (
                <p className="mt-0.5 text-xs font-medium text-blue-600">Fasilitas: {a.fasilitasNama}</p>
              )}
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{a.deskripsi}</p>

              {a.tanggapan ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-relaxed text-emerald-800">
                  <span className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="material-symbols-outlined icon-fill text-[18px]">forum</span>
                    Tanggapan Admin:
                  </span>
                  {a.tanggapan}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setResponTarget(a); setTanggapan(''); }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  Beri Tanggapan
                </button>
              )}
            </GlassCard>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-gray-400">
            Tidak ada aduan pada filter ini.
          </div>
        )}
      </StaggerGroup>

      {responTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900">Tanggapi: {responTarget.judul}</h2>
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleRespon}>
              <textarea
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                rows={4}
                required
                placeholder="Tulis tanggapan resmi untuk aduan ini…"
                className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResponTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                >
                  {saving ? 'Menyimpan...' : 'Kirim Tanggapan'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
