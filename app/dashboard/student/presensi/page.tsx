import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Presensi & Izin' };

export default function PresensiPage() {
  return (
    <PagePlaceholder
      icon="how_to_reg"
      title="Presensi & Izin"
      description="Lakukan check-in harian, ajukan izin atau sakit, dan pantau riwayat kehadiranmu dalam satu halaman."
    />
  );
}
