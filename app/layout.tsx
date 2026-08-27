import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PantauSiswa — Sistem Pantauan Siswa',
    template: '%s | PantauSiswa',
  },
  description:
    'Portal terintegrasi untuk presensi, tugas, dan fasilitas sekolah dalam satu platform modern.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8fafc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
