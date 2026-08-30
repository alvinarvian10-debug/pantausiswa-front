'use client';

import { useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import ScrollReveal from '../../../../components/ScrollReveal';
import { useAppData } from '../../../../lib/store';

export default function PengaturanPage() {
  const { pengaturan, updatePengaturan } = useAppData();
  const [form, setForm] = useState(pengaturan);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePengaturan(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          Pengaturan berhasil disimpan.
        </div>
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
              Preferensi Presensi &amp; Notifikasi
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
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Notifikasi WhatsApp ke Orang Tua</span>
                <input
                  type="checkbox"
                  checked={form.notifikasiWA}
                  onChange={(e) => setForm((f) => ({ ...f, notifikasiWA: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Notifikasi Email</span>
                <input
                  type="checkbox"
                  checked={form.notifikasiEmail}
                  onChange={(e) => setForm((f) => ({ ...f, notifikasiEmail: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </GlassCard>
        </ScrollReveal>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:bg-emerald-700 active:scale-[0.97] sm:w-auto sm:self-end"
        >
          <span className="material-symbols-outlined icon-fill text-[18px]">save</span>
          Simpan Perubahan
        </button>
      </form>
    </main>
  );
}
