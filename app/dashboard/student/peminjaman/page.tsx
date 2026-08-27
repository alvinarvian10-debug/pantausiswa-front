import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Peminjaman Fasilitas' };

export default function PeminjamanPage() {
  return (
    <PagePlaceholder
      icon="business_center"
      title="Peminjaman Fasilitas"
      description="Ajukan peminjaman ruangan, proyektor, dan fasilitas sekolah lainnya tanpa repot dan bebas bentrok jadwal."
    />
  );
}
