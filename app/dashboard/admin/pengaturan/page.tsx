import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function PengaturanPage() {
  return (
    <PagePlaceholder
      icon="settings"
      title="Pengaturan"
      description="Atur profil sekolah, tahun ajaran, hak akses pengguna, dan preferensi sistem PantauSiswa."
    />
  );
}
