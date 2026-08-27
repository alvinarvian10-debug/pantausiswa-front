import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Persetujuan Izin' };

export default function PersetujuanIzinPage() {
  return (
    <PagePlaceholder
      icon="check_circle"
      title="Persetujuan Izin"
      description="Setujui atau tolak pengajuan izin dan dispensasi siswa dengan lampiran bukti yang terdokumentasi rapi."
    />
  );
}
