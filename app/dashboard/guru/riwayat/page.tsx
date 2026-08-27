import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Riwayat' };

export default function RiwayatPage() {
  return (
    <PagePlaceholder
      icon="history"
      title="Riwayat"
      description="Telusuri riwayat aktivitas presensi, persetujuan izin, dan penilaian tugas dari waktu ke waktu."
    />
  );
}
