import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Master Data' };

export default function MasterDataPage() {
  return (
    <PagePlaceholder
      icon="database"
      title="Master Data"
      description="Kelola data induk siswa, guru, kelas, dan mata pelajaran dalam satu pusat data sekolah yang terpusat dan selalu sinkron."
    />
  );
}
