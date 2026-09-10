'use client';

import { useEffect, useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import {
  apiGetPengaturan,
  apiListPasswordRequests,
  apiReviewPasswordRequest,
  apiUpdatePengaturan,
  type BackendPasswordRequest,
} from '../../../../lib/api';
import { useAppData } from '../../../../lib/store';

export default function PengaturanPage() {
  const { pengaturan, updatePengaturan } = useAppData();
  const [form, setForm] = useState(pengaturan);
  const [saved, setSaved] = useState(false);
  const [cfgError, setCfgError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwNotice, setPwNotice] = useState('');
  const [pwError, setPwError] = useState('');
  const [requests, setRequests] = useState<BackendPasswordRequest[]>([]);
  const [reviewing, setReviewing] = useState<number | null>(null);

  // Profil + antrean persetujuan dimuat dari backend (sumber kebenaran).
  useEffect(() => {
    apiGetPengaturan()
      .then((cfg) =>
        setForm((f) => ({
          ...f,
          namaSekolah: cfg.namaSekolah,
          npsn: cfg.npsn,
          alamat: cfg.alamat ?? '',
          tahunAjaran: cfg.tahunAjaran,
          semester: (cfg.semester === 'Genap' ? 'Genap' : 'Ganjil') as 'Ganjil' | 'Genap',
          kepalaSekolah: cfg.kepalaSekolah ?? '',
          jamMasuk: cfg.jamMasuk,
          batasToleransi: cfg.batasToleransi,
        })),
      )
      .catch((err: unknown) =>
        setCfgError(
          err instanceof Error
            ? `Profil dari backend gagal dimuat: ${err.message}`
            : 'Profil dari backend gagal dimuat.',
        ),
      );
    apiListPasswordRequests('MENUNGGU')
      .then(setRequests)
      .catch(() => setRequests([]));
  }, []);

  // Setujui = password baru langsung berlaku di backend (hash tersimpan aman).
  const handleSetujuPassword = async (requestId: number) => {
    if (reviewing !== null) return;
    setReviewing(requestId);
    setPwNotice('');
    setPwError('');
    try {
      await apiReviewPasswordRequest(requestId, 'APPROVE');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPwNotice('Permintaan disetujui — password baru langsung berlaku.');
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : 'Gagal menyetujui permintaan.',
      );
    } finally {
      setReviewing(null);
    }
  };

  const handleTolakPassword = async (requestId: number) => {
    if (reviewing !== null) return;
    setReviewing(requestId);
    setPwNotice('');
    setPwError('');
    try {
      await apiReviewPasswordRequest(requestId, 'REJECT');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPwNotice('Permintaan ditolak.');
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : 'Gagal menolak permintaan.',
      );
    } finally {
      setReviewing(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setCfgError('');
    try {
      await apiUpdatePengaturan({
        namaSekolah: form.namaSekolah,
        npsn: form.npsn,
        alamat: form.alamat,
        tahunAjaran: form.tahunAjaran,
        semester: form.semester,
        kepalaSekolah: form.kepalaSekolah,
        jamMasuk: form.jamMasuk,
        batasToleransi: form.batasToleransi,
      });
      updatePengaturan(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setCfgError(
        err instanceof Error
          ? `Gagal menyimpan ke backend: ${err.message}`
          : 'Gagal menyimpan ke backend.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 p-4 sm:p-6 md:gap-8 md:p-8">
      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Pengaturan</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Kelola profil sekolah, tahun ajaran, dan preferensi sistem PantauSiswa.
          </p>
        </div>
      </ScrollReveal>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
          Pengaturan berhasil disimpan di backend.
        </div>
      )}

      {cfgError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-100">
          <span className="material-symbols-outlined icon-fill text-[18px]">error</span>
          {cfgError}
        </div>
      )}

      {requests.length > 0 && (
        <ScrollReveal delay={0.03}>
          <GlassCard className="p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-emerald-600">admin_panel_settings</span>
              Persetujuan Ganti Password Sekretaris
            </h2>
            <p className="mb-5 text-sm text-gray-500">Menyetujui berarti password baru langsung berlaku untuk akun peminta.</p>
            {pwNotice && (
              <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{pwNotice}</p>
            )}
            {pwError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{pwError}</p>
            )}
            <div className="flex flex-col gap-3">
              {requests.map((request) => (
                <div key={request.id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{request.requester?.nama ?? '-'} · {request.requester?.sekretaris?.kelas?.nama ?? '-'}</p>
                    <p className="text-xs text-gray-500">{request.requester?.email ?? '-'}</p>
                    <p className="mt-1 text-xs text-gray-400">Diajukan {new Date(request.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={reviewing === request.id} onClick={() => handleTolakPassword(request.id)} className="rounded-lg border border-red-100 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Tolak</button>
                    <button type="button" disabled={reviewing === request.id} onClick={() => handleSetujuPassword(request.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">Setujui</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </ScrollReveal>
      )}

      <form className="flex flex-col gap-6" onSubmit={handleSave}>
        <ScrollReveal delay={0.05}>
          <GlassCard className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-emerald-600">school</span>
              Profil Sekolah
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nama Sekolah</label>
                <input
                  type="text"
                  value={form.namaSekolah}
                  onChange={(e) => setForm((f) => ({ ...f, namaSekolah: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">NPSN</label>
                <input
                  type="text"
                  value={form.npsn}
                  onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Kepala Sekolah</label>
                <input
                  type="text"
                  value={form.kepalaSekolah}
                  onChange={(e) => setForm((f) => ({ ...f, kepalaSekolah: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Alamat</label>
                <input
                  type="text"
                  value={form.alamat}
                  onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-emerald-600">calendar_month</span>
              Tahun Ajaran
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tahun Ajaran</label>
                <input
                  type="text"
                  value={form.tahunAjaran}
                  onChange={(e) => setForm((f) => ({ ...f, tahunAjaran: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value as 'Ganjil' | 'Genap' }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  <option>Ganjil</option>
                  <option>Genap</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="material-symbols-outlined icon-fill text-emerald-600">tune</span>
              Preferensi Presensi
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Jam Masuk Sekolah</label>
                <input
                  type="time"
                  value={form.jamMasuk}
                  onChange={(e) => setForm((f) => ({ ...f, jamMasuk: e.target.value }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Toleransi Keterlambatan (menit)</label>
                <input
                  type="number"
                  min={0}
                  value={form.batasToleransi}
                  onChange={(e) => setForm((f) => ({ ...f, batasToleransi: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-emerald-500/70 sm:w-auto sm:self-end"
        >
          <span className="material-symbols-outlined icon-fill text-[18px]">save</span>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </main>
  );
}
