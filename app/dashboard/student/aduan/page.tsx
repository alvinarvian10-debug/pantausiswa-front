import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Aduan' };

export default function AduanPage() {
  return (
    <PagePlaceholder
      icon="campaign"
      title="Aduan"
      description="Laporkan kendala fasilitas sekolah atau masalah administrasi melalui sistem ticketing yang cepat dan transparan."
    />
  );
}
