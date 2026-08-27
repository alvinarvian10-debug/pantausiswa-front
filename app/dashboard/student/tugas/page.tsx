import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Tugas' };

export default function TugasPage() {
  return (
    <PagePlaceholder
      icon="assignment"
      title="Tugas"
      description="Lihat daftar tugas aktif, unggah pekerjaanmu, dan pantau nilai yang sudah keluar dari guru."
    />
  );
}
