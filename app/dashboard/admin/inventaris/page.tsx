import type { Metadata } from 'next';
import PagePlaceholder from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Inventaris Fasilitas' };

export default function InventarisPage() {
  return (
    <PagePlaceholder
      icon="inventory_2"
      title="Inventaris Fasilitas"
      description="Pantau stok, kondisi, dan status peminjaman barang serta ruangan sekolah secara real-time."
    />
  );
}
