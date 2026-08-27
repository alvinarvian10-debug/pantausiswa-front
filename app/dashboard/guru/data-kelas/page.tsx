import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Data Kelas' };

export default function DataKelasPage() {
  return (
    <PagePlaceholder
      icon="groups"
      title="Data Kelas"
      description="Kelola daftar siswa, struktur kelas, dan informasi wali murid untuk kelas yang Anda ampu."
    />
  );
}
