import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Laporan Pengaduan' };

export default function PengaduanPage() {
  return (
    <PagePlaceholder
      icon="report_problem"
      title="Laporan Pengaduan"
      description="Tinjau, prioritaskan, dan tangani tiket aduan fasilitas maupun administrasi dari seluruh warga sekolah."
    />
  );
}
