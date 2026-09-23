'use client';

/**
 * Frontend API client — satu-satunya jalur front ke backend.
 *
 * Arsitektur: browser -> proxy Next `/api/be/*` (same-origin) -> NestJS.
 * Token JWT hidup di cookie HttpOnly `pantausiswa.session` yang ditulis
 * route /api/auth/login dan dibaca server-side (proxy + middleware).
 * JavaScript TIDAK memegang token — aman dari pencurian via XSS.
 *
 * Mapping path lama (Next API) -> baru (NestJS via proxy):
 *  /api/auth/login        -> POST /api/auth/login { email, password }
 *  /api/siswa, /api/guru, /api/kelas -> /api/be/siswa|guru|kelas
 *  /api/complaints        -> /api/be/aduan
 *  /api/fasilitas         -> /api/be/barang
 *  /api/submisi           -> /api/be/tugas/:id/submissions
 */

// Proxy same-origin (cookie HttpOnly ikut otomatis terkirim).
export const API_BASE = '/api/be';

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // Same-origin ke proxy: cookie HttpOnly ikut terkirim otomatis.
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data as { message?: string })?.message ?? `Request ${path} gagal (${res.status})`,
    );
  }
  return data as T;
}

// ---- Auth (kontrak back/src/auth) ----

export type BackendRole = 'ADMIN' | 'GURU' | 'SISWA' | 'SEKRETARIS';

export interface BackendUser {
  id: number;
  email: string;
  nama: string;
  role: BackendRole;
}

export interface LoginResponse {
  user: BackendUser;
}

export function loginToBackend(email: string, password: string) {
  // Route Next server (bukan proxy): teruskan ke backend + set cookie HttpOnly.
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(async (res) => {
    const data = (await res.json().catch(() => null)) as LoginResponse & {
      message?: string;
    };
    if (!res.ok) {
      throw new Error(data?.message ?? 'Email atau password salah.');
    }
    return data;
  });
}

/** Profil user yang login (semua role). */
export function apiMe() {
  return apiFetch<BackendUser>('/auth/me');
}

/**
 * Cek backend terjangkau atau tidak via proxy same-origin.
 * Backend hidup + tanpa token -> proxy meneruskan 401 (cukup bukti online).
 * Backend mati -> proxy membalas 502/network error -> offline.
 */
export async function pingBackend(timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status === 401 || res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** frontend role -> dashboard href */
export function hrefForBackendRole(role: BackendRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'GURU':
      return '/dashboard/guru';
    case 'SEKRETARIS':
      return '/dashboard/secretary';
    default:
      return '/dashboard/student/beranda';
  }
}

// ---- Presensi & Izin (kontrak back/src/presensi + back/src/izin) ----

export type FrontJenisIzin = 'Izin' | 'Sakit' | 'Dispensasi';
export type BackendJenisIzin = 'IZIN' | 'SAKIT' | 'DISPENSASI';
export type BackendStatusIzin = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

/** Izin|Sakit|Dispensasi (UI) -> IZIN|SAKIT|DISPENSASI (back). */
export function toBackendJenis(jenis: string): BackendJenisIzin {
  const j = jenis.trim().toUpperCase();
  if (j === 'SAKIT') return 'SAKIT';
  if (j === 'DISPENSASI') return 'DISPENSASI';
  return 'IZIN';
}

export interface BackendIzin {
  id: number;
  siswaId: number;
  jenis: BackendJenisIzin;
  tanggalMulai: string;
  tanggalSelesai: string;
  keterangan: string;
  lampiranUrl: string | null;
  status: BackendStatusIzin;
  catatanReview: string | null;
  siswa?: {
    user?: { nama?: string };
    kelas?: { nama?: string } | null;
  };
}

export interface BackendPresensi {
  id: number;
  siswaId: number;
  tanggal: string;
  status: string;
  checkInAt: string | null;
  catatan: string | null;
}

/** Siswa check-in hari ini. Token menentukan siapa siswanya (back derive dari JWT). */
export function apiCheckIn(catatan?: string) {
  return apiFetch<BackendPresensi>('/presensi/check-in', {
    method: 'POST',
    body: JSON.stringify(catatan ? { catatan } : {}),
  });
}

/** Siswa mengajukan izin/sakit/dispensasi. */
export function apiCreateIzin(input: {
  jenis: FrontJenisIzin | string;
  tanggalMulai: string;
  tanggalSelesai: string;
  keterangan: string;
  lampiranUrl?: string;
}) {
  return apiFetch<BackendIzin>('/izin', {
    method: 'POST',
    body: JSON.stringify({
      jenis: toBackendJenis(input.jenis),
      tanggalMulai: input.tanggalMulai,
      tanggalSelesai: input.tanggalSelesai,
      keterangan: input.keterangan,
      ...(input.lampiranUrl ? { lampiranUrl: input.lampiranUrl } : {}),
    }),
  });
}

/** Riwayat izin milik siswa yang login. */
export function apiMyIzin() {
  return apiFetch<{ data: BackendIzin[] }>('/izin/me');
}

/** Riwayat presensi milik siswa yang login (beserta ringkasan per status). */
export function apiMyPresensi() {
  return apiFetch<{
    data: BackendPresensi[];
    ringkasan: Record<string, number>;
    meta: { total: number };
  }>('/presensi/me');
}

/** Daftar pengajuan untuk guru/admin (filter status opsional). */
export function apiListIzin(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ data: BackendIzin[] }>(`/izin${q}`);
}

/** Guru setujui/tolak pengajuan. id harus numerik (id baris backend). */
export function apiReviewIzin(
  id: number,
  status: 'DISETUJUI' | 'DITOLAK',
  catatanReview?: string,
) {
  return apiFetch<BackendIzin>(`/izin/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(
      catatanReview ? { status, catatanReview } : { status },
    ),
  });
}

// ---- Presensi manual (sekretaris/guru/admin) ----

export type FrontStatusPresensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
export type BackendStatusPresensi =
  | 'HADIR'
  | 'TERLAMBAT'
  | 'IZIN'
  | 'SAKIT'
  | 'ALPA';

/** Hadir|Sakit|Izin|Alpa (UI) -> HADIR|SAKIT|IZIN|ALPA (back). */
export function toBackendStatusPresensi(s: string): BackendStatusPresensi {
  const v = s.trim().toUpperCase();
  if (v === 'SAKIT') return 'SAKIT';
  if (v === 'IZIN') return 'IZIN';
  if (v === 'ALPA') return 'ALPA';
  return 'HADIR';
}

/**
 * Pencatatan manual: sekretaris (otomatis lingkup kelasnya),
 * guru, atau admin. siswaId = id numerik backend.
 */
export function apiCatatPresensi(input: {
  siswaId: number;
  status: FrontStatusPresensi | string;
  tanggal?: string;
  catatan?: string;
}) {
  return apiFetch<BackendPresensi>('/presensi/catat', {
    method: 'POST',
    body: JSON.stringify({
      siswaId: input.siswaId,
      status: toBackendStatusPresensi(input.status),
      ...(input.tanggal ? { tanggal: input.tanggal } : {}),
      ...(input.catatan ? { catatan: input.catatan } : {}),
    }),
  });
}

/**
 * Rekap harian: sekretaris otomatis lingkup kelasnya
 * (kelasId diabaikan backend), guru/admin boleh filter.
 */
export interface BackendRekapRow {
  siswaId: number;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  checkInAt: string | null;
  sudahCheckIn: boolean;
}

export function apiRekapPresensi(opts?: { kelasId?: number; tanggal?: string }) {
  const q = new URLSearchParams();
  if (opts?.kelasId != null) q.set('kelasId', String(opts.kelasId));
  if (opts?.tanggal) q.set('tanggal', opts.tanggal);
  const qs = q.toString();
  return apiFetch<BackendRekapRow[]>(`/presensi/rekap${qs ? `?${qs}` : ''}`);
}

// ---- Tugas & Submisi (kontrak back/src/tugas) ----

export interface BackendTugas {
  id: number;
  judul: string;
  deskripsi: string;
  mapelId: number;
  kelasId: number;
  tenggat: string;
  tanggalDiberikan: string | null;
  jadwalHari: string | null;
  jadwalJam: string | null;
  lampiranUrl: string | null;
  mapel?: { nama: string; kode: string };
  kelas?: { nama: string };
  submissionSaya?: BackendSubmission | null;
  sudahMengumpulkan?: boolean;
  _count?: { kumpulan: number };
}

export interface BackendSubmission {
  id: number;
  tugasId: number;
  siswaId: number;
  fileUrl: string;
  catatan: string | null;
  nilai: number | null;
  feedback: string | null;
  siswa?: {
    user?: { nama?: string };
  };
}

export interface BackendMapel {
  id: number;
  nama: string;
  kode: string;
}

export interface BackendKelas {
  id: number;
  nama: string;
  tingkat: string;
  waliId?: number | null;
  wali?: { user?: { nama?: string } } | null;
  _count?: { siswa?: number };
}

/** Ambil array dari respons backend (mendukung bentuk array langsung / { data }). */
async function apiList<T>(path: string): Promise<T[]> {
  const res = await apiFetch<T[] | { data: T[] }>(path);
  return Array.isArray(res) ? res : (res.data ?? []);
}

/** Daftar mapel (guru/admin). */
export function apiListMapel() {
  return apiList<BackendMapel>('/mapel');
}

/** Daftar kelas (guru/admin). */
export function apiListKelas() {
  return apiList<BackendKelas>('/kelas');
}

/** Guru membuat tugas. guruId diambil dari JWT. */
export function apiCreateTugas(input: {
  judul: string;
  deskripsi: string;
  mapelId: number;
  kelasId: number;
  tenggat: string;
  tanggalDiberikan?: string;
  jadwalHari?: string;
  jadwalJam?: string;
  lampiranUrl?: string;
}) {
  return apiFetch<BackendTugas>('/tugas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---- Format tampilan Tugas (locale id-ID, zona Asia/Jakarta) ----

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

/** "2026-09-25T23:59" (datetime-local, WIB) -> "2026-09-25T23:59:00+07:00" agar tak geser di server UTC. */
export function toBackendTenggat(localValue: string): string {
  const v = localValue.trim();
  if (!v) return v;
  // Sudah ada offset/zona (mis. +07:00 / Z) — teruskan apa adanya.
  if (/([+-]\d{2}:?\d{2}|Z)$/.test(v)) return v;
  // datetime-local "YYYY-MM-DDTHH:mm" atau "...THH:mm:ss" -> anggap waktu WIB.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v)) {
    const withSec = v.length === 16 ? `${v}:00` : v;
    return `${withSec}+07:00`;
  }
  // date-only legacy "YYYY-MM-DD" -> akhir hari WIB agar tak dianggap lewat saat dibuat.
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T23:59:00+07:00`;
  return v;
}

/** "2026-09-22" (date, WIB) -> "2026-09-22T00:00:00+07:00" (awal hari, tak geser di server UTC). */
export function toBackendTanggalDiberikan(localValue: string): string {
  const v = localValue.trim();
  if (!v) return v;
  if (/([+-]\d{2}:?\d{2}|Z)$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00+07:00`;
  return toBackendTenggat(v);
}

/** ISO datetime -> "Senin, 22 Sep 2026" (tanggal saja, zona Asia/Jakarta). */
export function formatTanggal(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

/** "2026-09-25T23:59:00+07:00" -> "Jumat, 25 Sep 2026 • 23:59 WIB" (tahan terhadap format lama date-only). */
export function formatTenggat(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const tgl = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
  // Backend lama hanya menyimpan tanggal (tengah malam UTC = 07:00 WIB):
  // tampilkan tanggal saja agar tak muncul "07:00" yang membingungkan.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  if (isDateOnly) return tgl;
  const jam = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(d)
    .replace('.', ':');
  return `${tgl} • ${jam} WIB`;
}

/** (hari, jam) -> "Untuk Pelajaran Hari: Senin, 07:00 - 08:30" atau null bila kosong. */
export function formatJadwal(hari?: string | null, jam?: string | null): string | null {
  const h = hari?.trim();
  const j = jam?.trim();
  if (!h && !j) return null;
  if (h && j) return `Untuk Pelajaran Hari: ${h}, ${j} WIB`;
  if (h) return `Untuk Pelajaran Hari: ${h}`;
  return `Jam Pelajaran: ${j} WIB`;
}

export { HARI_LIST };

/** Tugas milik guru yang login. */
export function apiListTugas() {
  return apiList<BackendTugas>('/tugas');
}

/** Tugas untuk siswa sesuai kelasnya (beserta submissionSaya). */
export function apiMyTugas() {
  return apiList<BackendTugas>('/tugas/saya');
}

/** Siswa mengumpulkan jawaban (upsert per tugas+siswa). */
export function apiSubmitTugas(
  tugasId: number,
  input: { fileUrl: string; catatan?: string },
) {
  return apiFetch<BackendSubmission>(`/tugas/${tugasId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Guru melihat pengumpulan untuk tugasnya. */
export function apiGetSubmissions(tugasId: number) {
  return apiList<BackendSubmission & { siswa?: { user?: { nama?: string } } }>(
    `/tugas/${tugasId}/submissions`,
  );
}

/** Guru menilai pengumpulan (0-100). */
export function apiGradeSubmission(
  subId: number,
  input: { nilai: number; feedback?: string },
) {
  return apiFetch<BackendSubmission>(`/tugas/submissions/${subId}/nilai`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---- Barang / Inventaris (kontrak back/src/inventaris) ----

export interface BackendBarang {
  id: number;
  nama: string;
  kode: string;
  kategori: string;
  kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
  jumlahTotal: number;
  jumlahTersedia: number;
  lokasi: string | null;
  fotoUrl: string | null;
  icon?: string | null;
}

/** Daftar barang (semua role login). */
export function apiListBarang(opts?: { search?: string; kategori?: string }) {
  const q = new URLSearchParams();
  if (opts?.search) q.set('search', opts.search);
  if (opts?.kategori) q.set('kategori', opts.kategori);
  const qs = q.toString();
  return apiList<BackendBarang>(`/barang${qs ? `?${qs}` : ''}`);
}

/** Admin menambah barang. jumlahTersedia otomatis = jumlahTotal. */
export function apiCreateBarang(input: {
  nama: string;
  kode: string;
  kategori: string;
  jumlahTotal: number;
  icon?: string;
}) {
  return apiFetch<BackendBarang>('/barang', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Admin ubah barang (termasuk kondisi). */
export function apiUpdateBarang(id: number, input: Record<string, unknown>) {
  return apiFetch<BackendBarang>(`/barang/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---- Peminjaman (kontrak back/src/peminjaman) ----

export type BackendStatusPeminjaman =
  | 'MENUNGGU'
  | 'DIPINJAM'
  | 'DIKEMBALIKAN'
  | 'DITOLAK';

export interface BackendPeminjaman {
  id: number;
  barangId: number;
  siswaId: number;
  jumlah: number;
  tanggalPinjam: string;
  tanggalKembali: string;
  jamPinjam: string | null;
  jamKembali: string | null;
  status: BackendStatusPeminjaman;
  catatan: string | null;
  barang?: BackendBarang;
  siswa?: {
    user?: { nama?: string };
    kelas?: { nama?: string } | null;
  };
}

/** Siswa mengajukan pinjaman. Stok berkurang saat admin APPROVE. */
export function apiCreatePeminjaman(input: {
  barangId: number;
  jumlah?: number;
  tanggalKembali: string;
  jamPinjam?: string;
  jamKembali?: string;
  catatan?: string;
}) {
  return apiFetch<BackendPeminjaman>('/peminjaman', {
    method: 'POST',
    body: JSON.stringify({
      jumlah: 1,
      ...(input.jamPinjam ? { jamPinjam: input.jamPinjam } : {}),
      ...(input.jamKembali ? { jamKembali: input.jamKembali } : {}),
      ...input,
    }),
  });
}

/** Riwayat peminjaman milik siswa yang login (?type=active|history opsional). */
export function apiMyPeminjaman(type?: 'active' | 'history') {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  return apiFetch<{ data: BackendPeminjaman[] }>(`/peminjaman/me${q}`);
}

/** Semua peminjaman (admin, filter status dan/atau type=active|history opsional). */
export function apiListPeminjaman(status?: string, type?: 'active' | 'history') {
  const params = new URLSearchParams();
  // Kompatibel: pemanggil lama bisa mengirim 'active'/'history' via argumen pertama.
  let effectiveStatus = status;
  let effectiveType = type;
  if (!effectiveType && (status === 'active' || status === 'history')) {
    effectiveType = status as 'active' | 'history';
    effectiveStatus = undefined;
  }
  if (effectiveStatus) params.set('status', effectiveStatus);
  if (effectiveType) params.set('type', effectiveType);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<{ data: BackendPeminjaman[] }>(`/peminjaman${q}`);
}

/** Siswa mengembalikan pinjamannya sendiri (harus miliknya + DIPINJAM). */
export function apiKembalikanMandiri(id: number) {
  return apiFetch<BackendPeminjaman>(`/peminjaman/${id}/kembalikan`, {
    method: 'POST',
  });
}

/** Admin menyetujui/menolak pengajuan peminjaman. */
export function apiReviewPeminjaman(
  id: number,
  aksi: 'APPROVE' | 'REJECT',
  catatan?: string,
) {
  return apiFetch<BackendPeminjaman>(`/peminjaman/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(catatan ? { aksi, catatan } : { aksi }),
  });
}

/** Admin menandai barang sudah dikembalikan. */
export function apiAdminKembalikan(id: number) {
  return apiFetch<BackendPeminjaman>(`/peminjaman/${id}/kembalikan`, {
    method: 'PATCH',
  });
}

// ---- Aduan (kontrak back/src/aduan) ----

export type BackendKategoriAduan = 'FASILITAS' | 'ADMINISTRASI' | 'LAINNYA';
export type BackendStatusAduan = 'BARU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';

/** Fasilitas|Keluhan (UI) -> FASILITAS|LAINNYA (back). */
export function toBackendKategori(jenis: string): BackendKategoriAduan {
  return jenis.trim().toLowerCase() === 'fasilitas' ? 'FASILITAS' : 'LAINNYA';
}

/** Baru|Proses|Selesai (UI) -> BARU|DIPROSES|SELESAI (back). */
export function toBackendStatusAduan(status: string): BackendStatusAduan {
  const s = status.trim().toLowerCase();
  if (s === 'proses') return 'DIPROSES';
  if (s === 'selesai') return 'SELESAI';
  return 'BARU';
}

export interface BackendAduan {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: BackendKategoriAduan;
  prioritas: string;
  status: BackendStatusAduan;
  lampiranUrl: string | null;
  isAnonim: boolean;
  tanggapan: string | null;
  createdAt?: string;
  pelapor?: { nama: string; role: string } | null;
}

/** Buat tiket aduan (semua role). Anonim disamarkan di daftar admin. */
export function apiCreateAduan(input: {
  judul: string;
  deskripsi: string;
  kategori: BackendKategoriAduan | string;
  lampiranUrl?: string;
  isAnonim?: boolean;
}) {
  const kategori =
    input.kategori === 'FASILITAS' ||
    input.kategori === 'ADMINISTRASI' ||
    input.kategori === 'LAINNYA'
      ? input.kategori
      : toBackendKategori(input.kategori);
  return apiFetch<BackendAduan>('/aduan', {
    method: 'POST',
    body: JSON.stringify({
      judul: input.judul,
      deskripsi: input.deskripsi,
      kategori,
      ...(input.lampiranUrl ? { lampiranUrl: input.lampiranUrl } : {}),
      ...(input.isAnonim ? { isAnonim: true } : {}),
    }),
  });
}

/** Admin tangani tiket: status + tanggapan. */
export function apiUpdateAduan(
  id: number,
  input: { status?: BackendStatusAduan | string; tanggapan?: string },
) {
  return apiFetch<BackendAduan>(`/aduan/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/** Tiket milik saya (semua role). */
export function apiMyAduan() {
  return apiFetch<{ data: BackendAduan[] }>('/aduan/me');
}

/** Semua tiket (admin, filter status opsional). */
export function apiListAduan(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ data: BackendAduan[] }>(`/aduan${q}`);
}

// ---- Master Data (kontrak back/src/master-data + back/src/import) ----

export const DEFAULT_AKUN_PASSWORD = 'password123';

/** NIS → email akun siswa (auto-generate, NIS itu unik). */
export function emailSiswaFromNis(nis: string): string {
  const slug = nis.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${slug || 'siswa'}@student.sysch.id`;
}

/** Nama → email akun guru (auto-generate). */
export function emailGuruFromNama(nama: string): string {
  const slug = nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug || 'guru'}@guru.sysch.id`;
}

/** NIP auto-generate (wajib unik di backend). */
export function nipOtomatis(): string {
  return `NIP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase()}`;
}

/** "X IPA 1" -> "10" (wajib diisi saat buat kelas di backend). */
export function tingkatDariNama(nama: string): string {
  const digits = nama.match(/\d+/);
  if (digits) return digits[0];
  const upper = ` ${nama.toUpperCase()} `;
  for (const [romawi, angka] of [
    ['XII', '12'],
    ['XI', '11'],
    ['VIII', '8'],
    ['VII', '7'],
    ['IX', '9'],
    ['III', '3'],
    ['II', '2'],
    ['IV', '4'],
    ['VI', '6'],
    ['X', '10'],
    ['V', '5'],
    ['I', '1'],
  ] as const) {
    if (upper.includes(` ${romawi} `)) return angka;
  }
  return '10';
}

export interface BackendSiswa {
  id: number;
  nama: string;
  nis: string;
  email?: string;
  kelasId?: number | null;
  kelas?: { nama: string } | null;
  siswa?: { id: number; nis: string; kelasId: number | null };
}

export interface BackendGuru {
  id: number;
  nama: string;
  email?: string;
  nip?: string;
  mapel?: string[];
  kelasDiampu?: { id: number; nama: string }[];
  guru?: { id: number };
}

export function apiListSiswa() {
  return apiList<BackendSiswa>('/siswa');
}

export function apiCreateSiswa(input: {
  email: string;
  password: string;
  nama: string;
  nis: string;
  kelasId?: number;
}) {
  return apiFetch<BackendSiswa>('/siswa', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function apiUpdateSiswa(id: number, input: Record<string, unknown>) {
  return apiFetch<BackendSiswa>(`/siswa/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function apiDeleteSiswa(id: number) {
  return apiFetch<{ message?: string }>(`/siswa/${id}`, { method: 'DELETE' });
}

export function apiListGuru() {
  return apiList<BackendGuru>('/guru');
}

export function apiCreateGuru(input: {
  email: string;
  password: string;
  nama: string;
  nip: string;
  mapelIds?: number[];
}) {
  return apiFetch<BackendGuru & { guru?: { id: number } }>('/guru', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function apiUpdateGuru(id: number, input: Record<string, unknown>) {
  return apiFetch<BackendGuru>(`/guru/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function apiDeleteGuru(id: number) {
  return apiFetch<{ message?: string }>(`/guru/${id}`, { method: 'DELETE' });
}

export function apiCreateKelas(input: {
  nama: string;
  tingkat: string;
  waliId?: number;
}) {
  return apiFetch<BackendKelas>('/kelas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function apiUpdateKelas(id: number, input: Record<string, unknown>) {
  return apiFetch<BackendKelas>(`/kelas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function apiDeleteKelas(id: number) {
  return apiFetch<{ message?: string }>(`/kelas/${id}`, { method: 'DELETE' });
}

export interface ImportSkipped {
  row: number;
  reason: string;
}

export interface ImportResponse {
  added: number;
  skipped: ImportSkipped[];
  createdKelas: { id: string; nama: string; waliKelasId?: string | null }[];
  created: {
    id: string;
    nama: string;
    nis?: string;
    kelasId?: string | null;
    mapel?: string;
    waliKelasId?: string | null;
  }[];
}

/** Impor massal siswa (Excel sudah diparsing di frontend). */
export function apiImportSiswa(
  rows: { nama: string; nis: string; kelasNama: string }[],
) {
  return apiFetch<ImportResponse>('/import/siswa', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

/** Impor massal guru (mapel disimpan lokal — backend tak punya relasinya). */
export function apiImportGuru(
  rows: { nama: string; mapel: string[]; waliKelasNama: string | null }[],
) {
  return apiFetch<ImportResponse>('/import/guru', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

// ---- Pengaturan sekolah (kontrak back/src/pengaturan) ----

export interface BackendPengaturan {
  id: number;
  namaSekolah: string;
  npsn: string;
  alamat: string | null;
  tahunAjaran: string;
  semester: string;
  kepalaSekolah: string | null;
  jamMasuk: string;
  batasToleransi: number;
  notifikasiWA: boolean;
  notifikasiEmail: boolean;
}

/** Profil sekolah (semua role login bisa baca). */
export function apiGetPengaturan() {
  return apiFetch<BackendPengaturan>('/pengaturan');
}

/** Admin ubah profil/pengaturan sekolah. */
export function apiUpdatePengaturan(patch: Record<string, unknown>) {
  return apiFetch<BackendPengaturan>('/pengaturan', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// ---- Password request sekretaris (kontrak back/src/password-request) ----

export type BackendStatusPwRequest = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

export interface BackendPasswordRequest {
  id: number;
  requesterId: number;
  status: BackendStatusPwRequest;
  catatan: string | null;
  createdAt: string;
  requester?: {
    nama: string;
    email: string;
    sekretaris?: { kelas?: { nama: string } | null } | null;
  };
}

/** Sekretaris mengajukan password baru (min. 6 karakter). */
export function apiCreatePasswordRequest(newPassword: string) {
  return apiFetch<{ message: string; id: number }>('/password-requests', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

/** Riwayat permintaan milik sendiri (untuk status menunggu). */
export function apiMyPasswordRequests() {
  return apiFetch<BackendPasswordRequest[]>('/password-requests/me');
}

/** Semua permintaan (admin). */
export function apiListPasswordRequests(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<BackendPasswordRequest[]>(`/password-requests${q}`);
}

/** Admin setujui (password langsung berlaku) / tolak. */
export function apiReviewPasswordRequest(
  id: number,
  aksi: 'APPROVE' | 'REJECT',
) {
  return apiFetch<{ message: string }>(`/password-requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ aksi }),
  });
}

/** Admin mengganti password akun lain langsung. */
export function apiAdminSetPassword(input: {
  email?: string;
  userId?: number;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>('/auth/admin-set-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---- Analitik (kontrak back/src/analitik, ADMIN/GURU) ----

export interface BackendRingkasan {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  kehadiranHariIni: { hadir: number; tercatat: number; persentase: number };
  tugasAktif: number;
  aduanBaru: number;
  totalTugas: number;
  totalPeminjaman: number;
  totalAduan: number;
}

export interface BackendTrenHarian {
  tanggal: string;
  persentase: number;
  hadir: number;
  total: number;
}

export interface BackendNilai {
  rataRata: number;
  totalDinilai: number;
  perMapel: { mapel: string; rata: number; count: number }[];
}

export interface BackendDistribusiAduan {
  status: Record<string, number>;
  prioritas: Record<string, number>;
}

export function apiRingkasan() {
  return apiFetch<BackendRingkasan>('/analitik/ringkasan');
}

export function apiTrenKehadiran(days = 7) {
  return apiFetch<BackendTrenHarian[]>(`/analitik/kehadiran-tren?days=${days}`);
}

export function apiStatistikNilai() {
  return apiFetch<BackendNilai>('/analitik/nilai');
}

export function apiDistribusiAduan() {
  return apiFetch<BackendDistribusiAduan>('/analitik/aduan-status');
}
