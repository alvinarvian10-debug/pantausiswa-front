import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Kelola Tugas' };

export default function KelolaTugasPage() {
  return (
    <PagePlaceholder
      icon="assignment"
      title="Kelola Tugas"
      description="Buat, bagikan, dan nilai tugas untuk kelas Anda — lengkap dengan tenggat waktu dan status pengumpulan."
    />
  );
}
