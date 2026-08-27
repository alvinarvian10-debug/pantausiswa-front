import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Analitik Sekolah' };

export default function AnalitikPage() {
  return (
    <PagePlaceholder
      icon="analytics"
      title="Analitik Sekolah"
      description="Lihat tren kehadiran, performa akademik per kelas, dan statistik operasional untuk mendukung pengambilan keputusan."
    />
  );
}
