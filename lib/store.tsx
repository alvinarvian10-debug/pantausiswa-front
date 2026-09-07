'use client';

/**
 * PantauSiswa shared data layer.
 *
 * There is no backend yet, so this Context simulates one: a single source
 * of truth for every collection (siswa, kelas, presensi, izin, fasilitas,
 * peminjaman, tugas, submisi, aduan, riwayat, pengaturan), persisted to
 * localStorage so it survives refreshes and is shared across every route
 * under /dashboard within the same browser.
 *
 * When a real backend exists, only this file needs to change — every page
 * consumes data exclusively through the `useAppData()` hook below, never
 * through localStorage or hardcoded arrays directly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export type AvatarTone = 'emerald' | 'slate' | 'amber' | 'blue' | 'red';

export interface Siswa {
  id: string;
  nama: string;
  nis: string;
  kelasId: string;
  tone: AvatarTone;
}

export interface Guru {
  id: string;
  nama: string;
  mapel: string[];
  waliKelasId: string | null;
  tone: AvatarTone;
}

export interface SekretarisAccount {
  id: string;
  nama: string;
  username: string;
  password: string;
  kelasId: string;
}

export interface PasswordChangeRequest {
  id: string;
  sekretarisId: string;
  passwordBaru: string;
  diajukanPada: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  diprosesPada: string | null;
}

export interface Kelas {
  id: string;
  nama: string;
  waliKelasId: string | null;
}

export type StatusPresensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface PresensiRecord {
  id: string;
  siswaId: string;
  tanggal: string; // ISO date yyyy-mm-dd
  waktu: string;
  status: StatusPresensi;
  keterangan: string;
}

export type JenisIzin = 'Izin' | 'Sakit' | 'Dispensasi';
export type StatusIzin = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface IzinRequest {
  id: string;
  siswaId: string;
  kelasId: string;
  jenis: JenisIzin;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  lampiranNama: string | null;
  status: StatusIzin;
  alasanTolak: string | null;
  diajukanPada: string;
  diprosesPada: string | null;
}

export type KategoriFasilitas = 'Ruangan' | 'Elektronik' | 'Olahraga';
export type KondisiFasilitas = 'Baik' | 'Rusak' | 'Diperbaiki';

export interface Fasilitas {
  id: string;
  nama: string;
  kategori: KategoriFasilitas;
  icon: string;
  jumlahTotal: number;
  jumlahTersedia: number;
  kondisi: KondisiFasilitas;
}

export type StatusPeminjaman = 'Diajukan' | 'Dipinjam' | 'Dikembalikan' | 'Ditolak';

export interface Peminjaman {
  id: string;
  siswaId: string;
  fasilitasId: string;
  keperluan: string;
  tanggalPinjam: string;
  batasKembali: string;
  status: StatusPeminjaman;
}

export interface Tugas {
  id: string;
  guruId: string;
  kelasId: string;
  mapel: string;
  judul: string;
  deskripsi: string;
  lampiranNama: string | null;
  lampiranLink: string | null;
  deadline: string;
  dibuatPada: string;
}

export type TipeSubmisi = 'Foto' | 'File' | 'Link';
export type StatusSubmisi = 'Menunggu Nilai' | 'Dinilai';

export interface SubmisiTugas {
  id: string;
  tugasId: string;
  siswaId: string;
  tipe: TipeSubmisi;
  konten: string; // data URL for Foto, filename for File, URL for Link
  dikumpulkanPada: string;
  status: StatusSubmisi;
  nilai: number | null;
  feedback: string | null;
}

export type JenisAduan = 'Fasilitas' | 'Keluhan';
export type StatusAduan = 'Baru' | 'Proses' | 'Selesai';

export interface Aduan {
  id: string;
  siswaId: string;
  jenis: JenisAduan;
  fasilitasId: string | null;
  judul: string;
  deskripsi: string;
  lampiranNama: string | null;
  isAnonim: boolean;
  status: StatusAduan;
  tanggapan: string | null;
  tanggal: string;
}

export interface RiwayatGuru {
  id: string;
  guruId: string;
  aksi: string;
  keterangan: string;
  waktu: string;
}

export interface Pengaturan {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  kepalaSekolah: string;
  jamMasuk: string;
  batasToleransi: number;
  notifikasiWA: boolean;
  notifikasiEmail: boolean;
}

interface AppData {
  siswa: Siswa[];
  guru: Guru[];
  sekretaris: SekretarisAccount[];
  permintaanPassword: PasswordChangeRequest[];
  kelas: Kelas[];
  presensi: PresensiRecord[];
  izin: IzinRequest[];
  fasilitas: Fasilitas[];
  peminjaman: Peminjaman[];
  tugas: Tugas[];
  submisi: SubmisiTugas[];
  aduan: Aduan[];
  riwayatGuru: RiwayatGuru[];
  pengaturan: Pengaturan;
}

// ============================================================================
// Seed data — consistent with names/numbers already used across dashboards
// ============================================================================

const SEED: AppData = {
  siswa: [
    { id: 'S-01', nama: 'Rafi Pratama', nis: '2024001', kelasId: 'K-01', tone: 'emerald' },
    { id: 'S-02', nama: 'Ahmad Faisal', nis: '2024002', kelasId: 'K-01', tone: 'blue' },
    { id: 'S-03', nama: 'Siti Nurhaliza', nis: '2024003', kelasId: 'K-01', tone: 'amber' },
    { id: 'S-04', nama: 'Dewi Anggraini', nis: '2024004', kelasId: 'K-01', tone: 'red' },
    { id: 'S-05', nama: 'Budi Santoso', nis: '2024005', kelasId: 'K-02', tone: 'slate' },
    { id: 'S-06', nama: 'Citra Lestari', nis: '2024006', kelasId: 'K-02', tone: 'emerald' },
    { id: 'S-07', nama: 'Eka Wulandari', nis: '2024007', kelasId: 'K-02', tone: 'blue' },
  ],
  guru: [
    { id: 'G-01', nama: 'Bapak Hendra Wijaya', mapel: ['Matematika'], waliKelasId: 'K-01', tone: 'emerald' },
    { id: 'G-02', nama: 'Ibu Ratna Sari', mapel: ['Bahasa Inggris'], waliKelasId: 'K-02', tone: 'amber' },
  ],
  sekretaris: [
    { id: 'SK-01', nama: 'Sekretaris X IPA 1', username: 'sekretaris.xipa1', password: 'sekretaris123', kelasId: 'K-01' },
    { id: 'SK-02', nama: 'Sekretaris X IPA 2', username: 'sekretaris.xipa2', password: 'sekretaris123', kelasId: 'K-02' },
  ],
  permintaanPassword: [],
  kelas: [
    { id: 'K-01', nama: 'X IPA 1', waliKelasId: 'G-01' },
    { id: 'K-02', nama: 'X IPA 2', waliKelasId: 'G-02' },
  ],
  presensi: [
    { id: 'P-01', siswaId: 'S-01', tanggal: '2026-08-28', waktu: '06:45', status: 'Hadir', keterangan: 'Presensi via fingerprint' },
    { id: 'P-02', siswaId: 'S-01', tanggal: '2026-08-27', waktu: '06:52', status: 'Hadir', keterangan: 'Presensi via fingerprint' },
    { id: 'P-03', siswaId: 'S-01', tanggal: '2026-08-24', waktu: '08:10', status: 'Sakit', keterangan: 'Surat dokter terlampir' },
  ],
  izin: [
    {
      id: 'IZ-01', siswaId: 'S-02', kelasId: 'K-01', jenis: 'Sakit',
      tanggalMulai: '2026-08-28', tanggalSelesai: '2026-08-28',
      alasan: 'Demam sejak semalam, sudah periksa ke dokter.',
      lampiranNama: 'surat_dokter_ahmad.jpg', status: 'Menunggu', alasanTolak: null,
      diajukanPada: '2026-08-28T06:30:00', diprosesPada: null,
    },
    {
      id: 'IZ-02', siswaId: 'S-03', kelasId: 'K-01', jenis: 'Izin',
      tanggalMulai: '2026-08-28', tanggalSelesai: '2026-08-28',
      alasan: 'Ada acara keluarga yang tidak bisa ditinggalkan.',
      lampiranNama: 'surat_orang_tua.pdf', status: 'Menunggu', alasanTolak: null,
      diajukanPada: '2026-08-28T07:00:00', diprosesPada: null,
    },
    {
      id: 'IZ-03', siswaId: 'S-01', kelasId: 'K-01', jenis: 'Sakit',
      tanggalMulai: '2026-08-24', tanggalSelesai: '2026-08-24',
      alasan: 'Sakit flu dan pusing.',
      lampiranNama: 'surat_dokter.jpg', status: 'Disetujui', alasanTolak: null,
      diajukanPada: '2026-08-24T07:15:00', diprosesPada: '2026-08-24T07:40:00',
    },
  ],
  fasilitas: [
    { id: 'F-01', nama: 'Proyektor Mini', kategori: 'Elektronik', icon: 'videocam', jumlahTotal: 4, jumlahTersedia: 2, kondisi: 'Baik' },
    { id: 'F-02', nama: 'Ruang Lab Komputer', kategori: 'Ruangan', icon: 'computer', jumlahTotal: 1, jumlahTersedia: 1, kondisi: 'Baik' },
    { id: 'F-03', nama: 'Bola Basket', kategori: 'Olahraga', icon: 'sports_basketball', jumlahTotal: 6, jumlahTersedia: 5, kondisi: 'Baik' },
    { id: 'F-04', nama: 'Ruang Rapat', kategori: 'Ruangan', icon: 'meeting_room', jumlahTotal: 3, jumlahTersedia: 3, kondisi: 'Baik' },
    { id: 'F-05', nama: 'Speaker Portable', kategori: 'Elektronik', icon: 'speaker', jumlahTotal: 5, jumlahTersedia: 4, kondisi: 'Baik' },
    { id: 'F-06', nama: 'Net Voli', kategori: 'Olahraga', icon: 'sports_volleyball', jumlahTotal: 3, jumlahTersedia: 2, kondisi: 'Baik' },
    { id: 'F-07', nama: 'Mikrofon Wireless', kategori: 'Elektronik', icon: 'mic', jumlahTotal: 2, jumlahTersedia: 0, kondisi: 'Rusak' },
    { id: 'F-08', nama: 'AC Ruang Kelas 4', kategori: 'Ruangan', icon: 'ac_unit', jumlahTotal: 1, jumlahTersedia: 0, kondisi: 'Diperbaiki' },
  ],
  peminjaman: [
    { id: 'PJ-01', siswaId: 'S-01', fasilitasId: 'F-01', keperluan: 'Presentasi Sejarah', tanggalPinjam: '2026-08-28', batasKembali: '2026-08-28T16:00:00', status: 'Dipinjam' },
  ],
  tugas: [
    {
      id: 'TG-01', guruId: 'G-01', kelasId: 'K-01', mapel: 'Matematika',
      judul: 'Latihan Soal Aljabar Halaman 45–50',
      deskripsi: 'Kerjakan soal nomor 1 sampai 20, tulis tangan lalu foto atau scan hasilnya.',
      lampiranNama: 'soal_aljabar.pdf', lampiranLink: null,
      deadline: '2026-08-30', dibuatPada: '2026-08-25T08:00:00',
    },
    {
      id: 'TG-02', guruId: 'G-02', kelasId: 'K-01', mapel: 'Bahasa Inggris',
      judul: 'Essay "My Future Career" (500 kata)',
      deskripsi: 'Tulis essay dalam Bahasa Inggris minimal 500 kata, kumpulkan dalam bentuk dokumen.',
      lampiranNama: null, lampiranLink: 'https://docs.google.com/document/essay-template',
      deadline: '2026-08-29', dibuatPada: '2026-08-24T09:00:00',
    },
  ],
  submisi: [
    {
      id: 'SB-01', tugasId: 'TG-01', siswaId: 'S-02', tipe: 'File',
      konten: 'jawaban_ahmad_aljabar.pdf', dikumpulkanPada: '2026-08-27T19:00:00',
      status: 'Dinilai', nilai: 88, feedback: 'Bagus, tapi cek lagi nomor 12.',
    },
  ],
  aduan: [
    {
      id: 'AD-01', siswaId: 'S-01', jenis: 'Fasilitas', fasilitasId: 'F-08',
      judul: 'AC Ruang Kelas 4 Tidak Dingin', deskripsi: 'AC di ruang kelas 4 sejak seminggu terakhir tidak lagi dingin.',
      lampiranNama: null, isAnonim: false, status: 'Proses', tanggapan: null, tanggal: '2026-08-24',
    },
    {
      id: 'AD-02', siswaId: 'S-04', jenis: 'Keluhan', fasilitasId: null,
      judul: 'Bully di Antrean Kantin', deskripsi: 'Terjadi pembullyan saat antrean kantin oleh siswa kelas atas.',
      lampiranNama: null, isAnonim: true, status: 'Selesai',
      tanggapan: 'Terima kasih atas laporannya. Guru BK telah menindaklanjuti dan pengawasan kantin diperketat.',
      tanggal: '2026-08-20',
    },
  ],
  riwayatGuru: [
    { id: 'RG-01', guruId: 'G-01', aksi: 'Menyetujui izin', keterangan: 'Menyetujui pengajuan sakit atas nama Rafi Pratama', waktu: '2026-08-24T07:40:00' },
    { id: 'RG-02', guruId: 'G-01', aksi: 'Menilai tugas', keterangan: 'Memberi nilai 88 untuk tugas Aljabar milik Ahmad Faisal', waktu: '2026-08-27T20:00:00' },
    { id: 'RG-03', guruId: 'G-01', aksi: 'Membuat tugas', keterangan: 'Membuat tugas baru "Latihan Soal Aljabar" untuk kelas X IPA 1', waktu: '2026-08-25T08:00:00' },
  ],
  pengaturan: {
    namaSekolah: 'SMA Negeri 1 Harapan Bangsa',
    npsn: '20123456',
    alamat: 'Jl. Pendidikan No. 45, Kediri, Jawa Timur',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    kepalaSekolah: 'Dr. Suryanto, M.Pd.',
    jamMasuk: '07:00',
    batasToleransi: 15,
    notifikasiWA: true,
    notifikasiEmail: false,
  },
};

const STORAGE_KEY = 'pantausiswa.appdata.v1';

// Student the app currently "sits as" — no real auth yet.
export const CURRENT_SISWA_ID = 'S-01';
// Teacher the app currently "sits as" (wali kelas X IPA 1).
export const CURRENT_GURU_ID = 'G-01';
export const CURRENT_SEKRETARIS_ID = 'SK-01';

function loadInitial(): AppData {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Shallow-merge so new fields added in later versions still get a default.
    return { ...SEED, ...parsed };
  } catch {
    return SEED;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ============================================================================
// Context
// ============================================================================

interface AppDataContextValue extends AppData {
  ajukanIzin: (input: {
    siswaId: string;
    kelasId: string;
    jenis: JenisIzin;
    tanggalMulai: string;
    tanggalSelesai: string;
    alasan: string;
    lampiranNama: string | null;
    /** Jika diisi (id baris DB), dipakai sebagai id lokal agar PATCH guru cocok. */
    id?: string;
  }) => string;
  prosesIzin: (izinId: string, keputusan: 'Disetujui' | 'Ditolak', alasanTolak?: string) => void;
  checkIn: (siswaId: string) => void;
  catatPresensi: (sekretarisId: string, input: { siswaId: string; status: StatusPresensi; keterangan?: string }) => void;
  ajukanGantiPassword: (sekretarisId: string, passwordBaru: string) => void;
  prosesGantiPassword: (requestId: string, keputusan: 'Disetujui' | 'Ditolak') => void;

  ajukanPeminjaman: (input: { siswaId: string; fasilitasId: string; keperluan: string; batasKembali: string; id?: string }) => string | null;
  kembalikanPeminjaman: (peminjamanId: string) => void;
  tambahFasilitas: (input: Omit<Fasilitas, 'id'> & { id?: string }) => string;
  updateKondisiFasilitas: (fasilitasId: string, kondisi: KondisiFasilitas) => void;

  buatTugas: (input: Omit<Tugas, 'id' | 'dibuatPada'> & { id?: string }) => string;
  submitTugas: (input: { tugasId: string; siswaId: string; tipe: TipeSubmisi; konten: string; id?: string }) => string;
  nilaiSubmisi: (submisiId: string, nilai: number, feedback: string) => void;

  buatAduan: (input: {
    siswaId: string;
    jenis: JenisAduan;
    fasilitasId: string | null;
    judul: string;
    deskripsi: string;
    lampiranNama: string | null;
    isAnonim: boolean;
    /** Jika diisi (id baris DB), dipakai sebagai id lokal agar PATCH admin cocok. */
    id?: string;
  }) => string;
  siklusStatusAduan: (aduanId: string) => void;
  tanggapiAduan: (aduanId: string, tanggapan: string) => void;

  tambahRiwayatGuru: (guruId: string, aksi: string, keterangan: string) => void;
  updatePengaturan: (patch: Partial<Pengaturan>) => void;
  resetData: () => void;

  // Master Data CRUD
  addSiswa: (input: Omit<Siswa, 'id'> & { id?: string }) => string;
  updateSiswa: (id: string, patch: Partial<Omit<Siswa, 'id'>>) => void;
  deleteSiswa: (id: string) => void;
  addGuru: (input: Omit<Guru, 'id'> & { id?: string }) => string;
  updateGuru: (id: string, patch: Partial<Omit<Guru, 'id'>>) => void;
  deleteGuru: (id: string) => void;
  addKelas: (input: Omit<Kelas, 'id'> & { id?: string }) => string;
  updateKelas: (id: string, patch: Partial<Omit<Kelas, 'id'>>) => void;
  deleteKelas: (id: string) => void;

  /** Sisipkan baris dari server (hasil impor) — cocokkan id bila sudah ada. */
  upsertSiswa: (row: Siswa) => void;
  upsertGuru: (row: Guru) => void;
  upsertKelas: (row: Kelas) => void;
  /**
   * Migrasi baris lokal lama (id S-/G-/K-) ke id baris DB — seluruh referensi
   * (presensi, izin, tugas, kelas, dst.) ikut ditulis ulang agar tidak yatim.
   */
  adopsiIdSiswa: (idLama: string, row: Siswa) => void;
  adopsiIdGuru: (idLama: string, row: Guru) => void;
  adopsiIdKelas: (idLama: string, row: Kelas) => void;

  /** Atomic bulk import — resolves/creates classes by name and inserts all valid rows in one update. */
  bulkImportSiswa: (
    rows: { nama: string; nis: string; kelasNama: string }[],
  ) => { added: number; skipped: { row: number; reason: string }[] };
  bulkImportGuru: (
    rows: { nama: string; mapel: string[]; waliKelasNama: string | null }[],
  ) => { added: number; skipped: { row: number; reason: string }[] };

  // Convenience lookups
  getSiswa: (id: string) => Siswa | undefined;
  getGuru: (id: string) => Guru | undefined;
  getKelas: (id: string) => Kelas | undefined;
  getFasilitas: (id: string) => Fasilitas | undefined;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(SEED);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once, on the client, after mount (avoids SSR mismatch).
  useEffect(() => {
    setData(loadInitial());
    setHydrated(true);
  }, []);

  // Persist on every change (skip the very first render before hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable (private mode, quota) — fail silently.
    }
  }, [data, hydrated]);

  const ajukanIzin = useCallback<AppDataContextValue['ajukanIzin']>((input) => {
    const newId = input.id ?? uid('IZ');
    const { id: _ignored, ...rest } = input;
    setData((prev) => ({
      ...prev,
      izin: [
        {
          id: newId,
          ...rest,
          status: 'Menunggu',
          alasanTolak: null,
          diajukanPada: nowIso(),
          diprosesPada: null,
        },
        ...prev.izin,
      ],
    }));
    return newId;
  }, []);

  const prosesIzin = useCallback<AppDataContextValue['prosesIzin']>((izinId, keputusan, alasanTolak) => {
    setData((prev) => {
      const target = prev.izin.find((i) => i.id === izinId);
      const nextPresensi = [...prev.presensi];
      if (target && keputusan === 'Disetujui') {
        nextPresensi.unshift({
          id: uid('P'),
          siswaId: target.siswaId,
          tanggal: target.tanggalMulai,
          waktu: '-',
          status: target.jenis === 'Sakit' ? 'Sakit' : 'Izin',
          keterangan: target.alasan,
        });
      }
      return {
        ...prev,
        izin: prev.izin.map((i) =>
          i.id === izinId
            ? { ...i, status: keputusan, alasanTolak: alasanTolak ?? null, diprosesPada: nowIso() }
            : i,
        ),
        presensi: nextPresensi,
      };
    });
  }, []);

  const checkIn = useCallback<AppDataContextValue['checkIn']>((siswaId) => {
    setData((prev) => {
      const today = new Date().toISOString().slice(0, 10);
      const already = prev.presensi.some((p) => p.siswaId === siswaId && p.tanggal === today);
      if (already) return prev;
      return {
        ...prev,
        presensi: [
          {
            id: uid('P'),
            siswaId,
            tanggal: today,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            status: 'Hadir',
            keterangan: 'Presensi via check-in mandiri',
          },
          ...prev.presensi,
        ],
      };
    });
  }, []);

  const catatPresensi = useCallback<AppDataContextValue['catatPresensi']>((sekretarisId, input) => {
    setData((prev) => {
      const account = prev.sekretaris.find((a) => a.id === sekretarisId);
      const student = prev.siswa.find((s) => s.id === input.siswaId);
      if (!account || !student || account.kelasId !== student.kelasId) return prev;
      const today = new Date().toISOString().slice(0, 10);
      const existing = prev.presensi.find((p) => p.siswaId === input.siswaId && p.tanggal === today);
      const record: PresensiRecord = {
        id: existing?.id ?? uid('P'),
        siswaId: input.siswaId,
        tanggal: today,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }),
        status: input.status,
        keterangan: input.keterangan?.trim() || 'Dicatat oleh sekretaris kelas',
      };
      return {
        ...prev,
        presensi: existing
          ? prev.presensi.map((p) => (p.id === existing.id ? record : p))
          : [record, ...prev.presensi],
      };
    });
  }, []);

  const ajukanGantiPassword = useCallback<AppDataContextValue['ajukanGantiPassword']>((sekretarisId, passwordBaru) => {
    if (!passwordBaru.trim()) return;
    setData((prev) => ({
      ...prev,
      permintaanPassword: [
        { id: uid('PR'), sekretarisId, passwordBaru: passwordBaru.trim(), diajukanPada: nowIso(), status: 'Menunggu', diprosesPada: null },
        ...prev.permintaanPassword.filter((r) => !(r.sekretarisId === sekretarisId && r.status === 'Menunggu')),
      ],
    }));
  }, []);

  const prosesGantiPassword = useCallback<AppDataContextValue['prosesGantiPassword']>((requestId, keputusan) => {
    setData((prev) => {
      const req = prev.permintaanPassword.find((r) => r.id === requestId);
      if (!req || req.status !== 'Menunggu') return prev;
      return {
        ...prev,
        sekretaris: keputusan === 'Disetujui'
          ? prev.sekretaris.map((a) => a.id === req.sekretarisId ? { ...a, password: req.passwordBaru } : a)
          : prev.sekretaris,
        permintaanPassword: prev.permintaanPassword.map((r) => r.id === requestId ? { ...r, status: keputusan, diprosesPada: nowIso() } : r),
      };
    });
  }, []);

  const ajukanPeminjaman = useCallback<AppDataContextValue['ajukanPeminjaman']>((input) => {
    const fasilitas = data.fasilitas.find((f) => f.id === input.fasilitasId);
    if (!fasilitas || fasilitas.jumlahTersedia < 1) return null;
    const newId = input.id ?? uid('PJ');
    setData((prev) => ({
      ...prev,
      fasilitas: prev.fasilitas.map((f) =>
        f.id === input.fasilitasId ? { ...f, jumlahTersedia: f.jumlahTersedia - 1 } : f,
      ),
      peminjaman: [
        {
          id: newId,
          siswaId: input.siswaId,
          fasilitasId: input.fasilitasId,
          keperluan: input.keperluan,
          tanggalPinjam: new Date().toISOString().slice(0, 10),
          batasKembali: input.batasKembali,
          status: 'Dipinjam',
        },
        ...prev.peminjaman,
      ],
    }));
    return newId;
  }, [data.fasilitas]);

  const kembalikanPeminjaman = useCallback<AppDataContextValue['kembalikanPeminjaman']>((peminjamanId) => {
    setData((prev) => {
      const target = prev.peminjaman.find((p) => p.id === peminjamanId);
      if (!target) return prev;
      return {
        ...prev,
        peminjaman: prev.peminjaman.map((p) =>
          p.id === peminjamanId ? { ...p, status: 'Dikembalikan' } : p,
        ),
        fasilitas: prev.fasilitas.map((f) =>
          f.id === target.fasilitasId ? { ...f, jumlahTersedia: f.jumlahTersedia + 1 } : f,
        ),
      };
    });
  }, []);

  const tambahFasilitas = useCallback<AppDataContextValue['tambahFasilitas']>((input) => {
    const newId = input.id ?? uid('F');
    const { id: _ignored, ...rest } = input;
    setData((prev) => ({
      ...prev,
      fasilitas: [{ id: newId, ...rest }, ...prev.fasilitas],
    }));
    return newId;
  }, []);

  const updateKondisiFasilitas = useCallback<AppDataContextValue['updateKondisiFasilitas']>((fasilitasId, kondisi) => {
    setData((prev) => ({
      ...prev,
      fasilitas: prev.fasilitas.map((f) =>
        f.id === fasilitasId
          ? { ...f, kondisi, jumlahTersedia: kondisi === 'Baik' ? f.jumlahTersedia : 0 }
          : f,
      ),
    }));
  }, []);

  const buatTugas = useCallback<AppDataContextValue['buatTugas']>((input) => {
    const newId = input.id ?? uid('TG');
    const { id: _ignored, ...rest } = input;
    setData((prev) => ({
      ...prev,
      tugas: [{ id: newId, ...rest, dibuatPada: nowIso() }, ...prev.tugas],
    }));
    return newId;
  }, []);

  const submitTugas = useCallback<AppDataContextValue['submitTugas']>((input) => {
    const fallbackId = input.id ?? uid('SB');
    let resultId = fallbackId;
    setData((prev) => {
      const existingIdx = prev.submisi.findIndex(
        (s) => s.tugasId === input.tugasId && s.siswaId === input.siswaId,
      );
      // Pertahankan id lokal yang sudah ada (agar PATCH nilai tetap cocok);
      // untuk pengumpulan baru pakai id baris DB bila diberikan.
      resultId = existingIdx >= 0 ? prev.submisi[existingIdx].id : fallbackId;
      const record: SubmisiTugas = {
        id: resultId,
        tugasId: input.tugasId,
        siswaId: input.siswaId,
        tipe: input.tipe,
        konten: input.konten,
        dikumpulkanPada: nowIso(),
        status: 'Menunggu Nilai',
        nilai: null,
        feedback: null,
      };
      const nextSubmisi = [...prev.submisi];
      if (existingIdx >= 0) {
        nextSubmisi[existingIdx] = record;
      } else {
        nextSubmisi.unshift(record);
      }
      return { ...prev, submisi: nextSubmisi };
    });
    return resultId;
  }, []);

  const nilaiSubmisi = useCallback<AppDataContextValue['nilaiSubmisi']>((submisiId, nilai, feedback) => {
    setData((prev) => ({
      ...prev,
      submisi: prev.submisi.map((s) =>
        s.id === submisiId ? { ...s, nilai, feedback, status: 'Dinilai' } : s,
      ),
    }));
  }, []);

  const buatAduan = useCallback<AppDataContextValue['buatAduan']>((input) => {
    const newId = input.id ?? uid('AD');
    const { id: _ignored, ...rest } = input;
    setData((prev) => ({
      ...prev,
      aduan: [
        {
          id: newId,
          ...rest,
          status: 'Baru',
          tanggapan: null,
          tanggal: new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
          }),
        },
        ...prev.aduan,
      ],
    }));
    return newId;
  }, []);

  const siklusStatusAduan = useCallback<AppDataContextValue['siklusStatusAduan']>((aduanId) => {
    setData((prev) => ({
      ...prev,
      aduan: prev.aduan.map((a) => {
        if (a.id !== aduanId) return a;
        const next: StatusAduan = a.status === 'Baru' ? 'Proses' : a.status === 'Proses' ? 'Selesai' : 'Selesai';
        return { ...a, status: next };
      }),
    }));
  }, []);

  const tanggapiAduan = useCallback<AppDataContextValue['tanggapiAduan']>((aduanId, tanggapan) => {
    setData((prev) => ({
      ...prev,
      aduan: prev.aduan.map((a) => (a.id === aduanId ? { ...a, tanggapan } : a)),
    }));
  }, []);

  const tambahRiwayatGuru = useCallback<AppDataContextValue['tambahRiwayatGuru']>((guruId, aksi, keterangan) => {
    setData((prev) => ({
      ...prev,
      riwayatGuru: [{ id: uid('RG'), guruId, aksi, keterangan, waktu: nowIso() }, ...prev.riwayatGuru],
    }));
  }, []);

  const updatePengaturan = useCallback<AppDataContextValue['updatePengaturan']>((patch) => {
    setData((prev) => ({ ...prev, pengaturan: { ...prev.pengaturan, ...patch } }));
  }, []);

  const resetData = useCallback(() => {
    setData(SEED);
  }, []);

  // ---- Master Data CRUD ----
  const addSiswa = useCallback<AppDataContextValue['addSiswa']>((input) => {
    const { id: customId, ...rest } = input as Omit<Siswa, 'id'> & { id?: string };
    const id = customId ?? uid('S');
    setData((prev) => ({ ...prev, siswa: [...prev.siswa, { id, ...rest }] }));
    return id;
  }, []);

  const updateSiswa = useCallback<AppDataContextValue['updateSiswa']>((id, patch) => {
    setData((prev) => ({
      ...prev,
      siswa: prev.siswa.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteSiswa = useCallback<AppDataContextValue['deleteSiswa']>((id) => {
    setData((prev) => ({
      ...prev,
      siswa: prev.siswa.filter((s) => s.id !== id),
      // Cascade cleanup so no page is left showing orphaned records for a deleted student.
      presensi: prev.presensi.filter((p) => p.siswaId !== id),
      izin: prev.izin.filter((i) => i.siswaId !== id),
      peminjaman: prev.peminjaman.filter((p) => p.siswaId !== id),
      submisi: prev.submisi.filter((s) => s.siswaId !== id),
      aduan: prev.aduan.filter((a) => a.siswaId !== id),
    }));
  }, []);

  const addGuru = useCallback<AppDataContextValue['addGuru']>((input) => {
    const { id: customId, ...rest } = input as Omit<Guru, 'id'> & { id?: string };
    const id = customId ?? uid('G');
    setData((prev) => ({
      ...prev,
      guru: [
        ...prev.guru.map((g) =>
          rest.waliKelasId && g.waliKelasId === rest.waliKelasId ? { ...g, waliKelasId: null } : g,
        ),
        { id, ...rest },
      ],
    }));
    return id;
  }, []);

  const updateGuru = useCallback<AppDataContextValue['updateGuru']>((id, patch) => {
    setData((prev) => ({
      ...prev,
      guru: prev.guru.map((g) => {
        if (g.id === id) return { ...g, ...patch };
        if (patch.waliKelasId && g.waliKelasId === patch.waliKelasId) return { ...g, waliKelasId: null };
        return g;
      }),
    }));
  }, []);

  const deleteGuru = useCallback<AppDataContextValue['deleteGuru']>((id) => {
    setData((prev) => ({
      ...prev,
      guru: prev.guru.filter((g) => g.id !== id),
      // Any class this teacher was homeroom-assigned to loses that assignment
      // rather than pointing at a deleted teacher.
      kelas: prev.kelas.map((k) => (k.waliKelasId === id ? { ...k, waliKelasId: null } : k)),
      tugas: prev.tugas.filter((t) => t.guruId !== id),
      riwayatGuru: prev.riwayatGuru.filter((r) => r.guruId !== id),
    }));
  }, []);

  const addKelas = useCallback<AppDataContextValue['addKelas']>((input) => {
    const { id: customId, ...rest } = input as Omit<Kelas, 'id'> & { id?: string };
    const id = customId ?? uid('K');
    setData((prev) => ({ ...prev, kelas: [...prev.kelas, { id, ...rest }] }));
    return id;
  }, []);

  const updateKelas = useCallback<AppDataContextValue['updateKelas']>((id, patch) => {
    setData((prev) => ({
      ...prev,
      kelas: prev.kelas.map((k) => (k.id === id ? { ...k, ...patch } : k)),
    }));
  }, []);

  const deleteKelas = useCallback<AppDataContextValue['deleteKelas']>((id) => {
    setData((prev) => ({
      ...prev,
      kelas: prev.kelas.filter((k) => k.id !== id),
    }));
  }, []);

  const upsertSiswa = useCallback<AppDataContextValue['upsertSiswa']>((row) => {
    setData((prev) => ({
      ...prev,
      siswa: prev.siswa.some((s) => s.id === row.id)
        ? prev.siswa.map((s) => (s.id === row.id ? row : s))
        : [...prev.siswa, row],
    }));
  }, []);

  const upsertGuru = useCallback<AppDataContextValue['upsertGuru']>((row) => {
    setData((prev) => ({
      ...prev,
      guru: prev.guru.some((g) => g.id === row.id)
        ? prev.guru.map((g) => (g.id === row.id ? row : g))
        : [...prev.guru, row],
    }));
  }, []);

  const upsertKelas = useCallback<AppDataContextValue['upsertKelas']>((row) => {
    setData((prev) => ({
      ...prev,
      kelas: prev.kelas.some((k) => k.id === row.id)
        ? prev.kelas.map((k) => (k.id === row.id ? row : k))
        : [...prev.kelas, row],
    }));
  }, []);

  const adopsiIdSiswa = useCallback<AppDataContextValue['adopsiIdSiswa']>((idLama, row) => {
    if (idLama === row.id) {
      setData((prev) => ({ ...prev, siswa: prev.siswa.map((s) => (s.id === idLama ? row : s)) }));
      return;
    }
    setData((prev) => ({
      ...prev,
      siswa: [...prev.siswa.filter((s) => s.id !== idLama && s.id !== row.id), row],
      presensi: prev.presensi.map((p) => (p.siswaId === idLama ? { ...p, siswaId: row.id } : p)),
      izin: prev.izin.map((i) => (i.siswaId === idLama ? { ...i, siswaId: row.id } : i)),
      peminjaman: prev.peminjaman.map((p) => (p.siswaId === idLama ? { ...p, siswaId: row.id } : p)),
      submisi: prev.submisi.map((s) => (s.siswaId === idLama ? { ...s, siswaId: row.id } : s)),
      aduan: prev.aduan.map((a) => (a.siswaId === idLama ? { ...a, siswaId: row.id } : a)),
    }));
  }, []);

  const adopsiIdGuru = useCallback<AppDataContextValue['adopsiIdGuru']>((idLama, row) => {
    if (idLama === row.id) {
      setData((prev) => ({ ...prev, guru: prev.guru.map((g) => (g.id === idLama ? row : g)) }));
      return;
    }
    setData((prev) => ({
      ...prev,
      guru: [...prev.guru.filter((g) => g.id !== idLama && g.id !== row.id), row],
      kelas: prev.kelas.map((k) => (k.waliKelasId === idLama ? { ...k, waliKelasId: row.id } : k)),
      tugas: prev.tugas.map((t) => (t.guruId === idLama ? { ...t, guruId: row.id } : t)),
      riwayatGuru: prev.riwayatGuru.map((r) => (r.guruId === idLama ? { ...r, guruId: row.id } : r)),
    }));
  }, []);

  const adopsiIdKelas = useCallback<AppDataContextValue['adopsiIdKelas']>((idLama, row) => {
    if (idLama === row.id) {
      setData((prev) => ({ ...prev, kelas: prev.kelas.map((k) => (k.id === idLama ? row : k)) }));
      return;
    }
    setData((prev) => ({
      ...prev,
      kelas: [...prev.kelas.filter((k) => k.id !== idLama && k.id !== row.id), row],
      siswa: prev.siswa.map((s) => (s.kelasId === idLama ? { ...s, kelasId: row.id } : s)),
      guru: prev.guru.map((g) => (g.waliKelasId === idLama ? { ...g, waliKelasId: row.id } : g)),
      tugas: prev.tugas.map((t) => (t.kelasId === idLama ? { ...t, kelasId: row.id } : t)),
      izin: prev.izin.map((i) => (i.kelasId === idLama ? { ...i, kelasId: row.id } : i)),
    }));
  }, []);

  const TONE_CYCLE: AvatarTone[] = ['emerald', 'blue', 'amber', 'red', 'slate'];

  const bulkImportSiswa = useCallback<AppDataContextValue['bulkImportSiswa']>((rows) => {
    let added = 0;
    const skipped: { row: number; reason: string }[] = [];

    setData((prev) => {
      const nextKelas = [...prev.kelas];
      const nextSiswa = [...prev.siswa];
      const existingNis = new Set(prev.siswa.map((s) => s.nis));

      rows.forEach((row, idx) => {
        const nama = row.nama?.trim();
        const nis = row.nis != null ? String(row.nis).trim() : '';
        const kelasNama = row.kelasNama?.trim();

        if (!nama || !nis || !kelasNama) {
          skipped.push({ row: idx + 2, reason: 'Nama, NIS, atau Kelas kosong' });
          return;
        }
        if (existingNis.has(nis)) {
          skipped.push({ row: idx + 2, reason: `NIS ${nis} sudah terdaftar` });
          return;
        }

        let kelasRecord = nextKelas.find((k) => k.nama.toLowerCase() === kelasNama.toLowerCase());
        if (!kelasRecord) {
          kelasRecord = { id: uid('K'), nama: kelasNama, waliKelasId: null };
          nextKelas.push(kelasRecord);
        }

        nextSiswa.push({
          id: uid('S'),
          nama,
          nis,
          kelasId: kelasRecord.id,
          tone: TONE_CYCLE[nextSiswa.length % TONE_CYCLE.length],
        });
        existingNis.add(nis);
        added += 1;
      });

      return { ...prev, kelas: nextKelas, siswa: nextSiswa };
    });

    return { added, skipped };
  }, []);

  const bulkImportGuru = useCallback<AppDataContextValue['bulkImportGuru']>((rows) => {
    let added = 0;
    const skipped: { row: number; reason: string }[] = [];

    setData((prev) => {
      const nextKelas = [...prev.kelas];
      const nextGuru = [...prev.guru];

      rows.forEach((row, idx) => {
        const nama = row.nama?.trim();
        const mapel = (row.mapel ?? []).map((m) => m.trim()).filter(Boolean);

        if (!nama || mapel.length === 0) {
          skipped.push({ row: idx + 2, reason: 'Nama atau Mata Pelajaran kosong' });
          return;
        }

        let waliKelasId: string | null = null;
        if (row.waliKelasNama && row.waliKelasNama.trim()) {
          const kelasNama = row.waliKelasNama.trim();
          let kelasRecord = nextKelas.find((k) => k.nama.toLowerCase() === kelasNama.toLowerCase());
          if (!kelasRecord) {
            kelasRecord = { id: uid('K'), nama: kelasNama, waliKelasId: null };
            nextKelas.push(kelasRecord);
          }
          kelasRecord.waliKelasId = null; // resolved to the new guru id below
          waliKelasId = kelasRecord.id;
        }

        const guruId = uid('G');
        nextGuru.push({
          id: guruId,
          nama,
          mapel,
          waliKelasId,
          tone: TONE_CYCLE[nextGuru.length % TONE_CYCLE.length],
        });
        if (waliKelasId) {
          const idx2 = nextKelas.findIndex((k) => k.id === waliKelasId);
          if (idx2 >= 0) nextKelas[idx2] = { ...nextKelas[idx2], waliKelasId: guruId };
        }
        added += 1;
      });

      return { ...prev, kelas: nextKelas, guru: nextGuru };
    });

    return { added, skipped };
  }, []);

  const getSiswa = useCallback((id: string) => data.siswa.find((s) => s.id === id), [data.siswa]);
  const getGuru = useCallback((id: string) => data.guru.find((g) => g.id === id), [data.guru]);
  const getKelas = useCallback((id: string) => data.kelas.find((k) => k.id === id), [data.kelas]);
  const getFasilitas = useCallback((id: string) => data.fasilitas.find((f) => f.id === id), [data.fasilitas]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...data,
      ajukanIzin,
      prosesIzin,
      checkIn,
      catatPresensi,
      ajukanGantiPassword,
      prosesGantiPassword,
      ajukanPeminjaman,
      kembalikanPeminjaman,
      tambahFasilitas,
      updateKondisiFasilitas,
      buatTugas,
      submitTugas,
      nilaiSubmisi,
      buatAduan,
      siklusStatusAduan,
      tanggapiAduan,
      tambahRiwayatGuru,
      updatePengaturan,
      resetData,
      addSiswa,
      updateSiswa,
      deleteSiswa,
      addGuru,
      updateGuru,
      deleteGuru,
      addKelas,
      updateKelas,
      deleteKelas,
      upsertSiswa,
      upsertGuru,
      upsertKelas,
      adopsiIdSiswa,
      adopsiIdGuru,
      adopsiIdKelas,
      bulkImportSiswa,
      bulkImportGuru,
      getSiswa,
      getGuru,
      getKelas,
      getFasilitas,
    }),
    [
      data, ajukanIzin, prosesIzin, checkIn, catatPresensi, ajukanGantiPassword, prosesGantiPassword, ajukanPeminjaman, kembalikanPeminjaman,
      tambahFasilitas, updateKondisiFasilitas, buatTugas, submitTugas, nilaiSubmisi,
      buatAduan, siklusStatusAduan, tanggapiAduan, tambahRiwayatGuru, updatePengaturan,
      resetData, addSiswa, updateSiswa, deleteSiswa, addGuru, updateGuru, deleteGuru,
      addKelas, updateKelas, deleteKelas, upsertSiswa, upsertGuru, upsertKelas,
      adopsiIdSiswa, adopsiIdGuru, adopsiIdKelas, bulkImportSiswa, bulkImportGuru,
      getSiswa, getGuru, getKelas, getFasilitas,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within <AppDataProvider>');
  }
  return ctx;
}
