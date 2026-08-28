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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
