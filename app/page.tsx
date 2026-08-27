'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import HeroMockup from '../components/HeroMockup';
import SmoothScrollProvider from '../components/SmoothScrollProvider';
import ParallaxLayer from '../components/ParallaxLayer';
import AnimatedCounter from '../components/AnimatedCounter';
import StaggerGroup from '../components/StaggerGroup';
import RoleShowcase from '../components/RoleShowcase';
import ShowcaseCarousel from '../components/ShowcaseCarousel';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const FEATURES = [
  {
    icon: 'fact_check',
    title: 'Presensi Terpadu',
    description:
      'Pantau kehadiran siswa secara real-time dengan pencatatan digital yang akurat dan terintegrasi dengan laporan wali kelas.',
    tag: 'Real-time',
  },
  {
    icon: 'assignment_turned_in',
    title: 'Dispensasi & Izin',
    description:
      'Digitalisasi permohonan izin dan dispensasi siswa dengan alur persetujuan yang transparan dan cepat.',
    tag: 'Otomatis',
  },
  {
    icon: 'meeting_room',
    title: 'Peminjaman Fasilitas',
    description:
      'Booking ruangan, laboratorium, dan peralatan sekolah secara terpusat tanpa bentrok jadwal.',
    tag: 'Terpusat',
  },
  {
    icon: 'folder_special',
    title: 'Pengumpulan Tugas',
    description:
      'Portal terpusat untuk distribusi dan pengumpulan tugas, memudahkan evaluasi oleh tenaga pendidik.',
    tag: 'Effisien',
  },
  {
    icon: 'support_agent',
    title: 'Aduan Sekolah',
    description:
      'Sistem ticketing untuk pelaporan masalah fasilitas atau kendala administratif secara terstruktur.',
    tag: 'Helpdesk',
  },
  {
    icon: 'monitoring',
    title: 'Analitik Sekolah',
    description:
      'Dashboard analitik untuk memantau tren kehadiran, performa kelas, dan operasional sekolah keseluruhan.',
    tag: 'Insight',
  },
] as const;

const STATS = [
  { value: 100, suffix: '+', label: 'Sekolah Pengguna' },
  { value: 50, suffix: 'k+', label: 'Siswa Aktif' },
  { value: 99, suffix: '%', label: 'Uptime Server' },
  { value: 24, suffix: '/7', label: 'Dukungan Teknis' },
];

export default function BerandaPage() {
  return (
    <SmoothScrollProvider>
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white text-gray-600">
      <SiteHeader />

      <motion.main
        className="flex-grow"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ============ Hero ============ */}
        <motion.section
          className="relative overflow-hidden px-4 pt-12 pb-16 md:px-8 md:pt-24 md:pb-32"
          variants={itemVariants}
        >
          <ParallaxLayer
            aria-hidden="true"
            offset={50}
            className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-emerald-100/60 blur-3xl"
          />
          <ParallaxLayer
            aria-hidden="true"
            offset={80}
            className="pointer-events-none absolute -left-48 top-64 h-[420px] w-[420px] rounded-full bg-blue-50/80 blur-3xl"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
            <StaggerGroup
              as="div"
              className="flex flex-col gap-7"
              itemClassName=""
              stagger={0.12}
            >
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Transformasi Digital{' '}
                <span className="relative whitespace-nowrap text-emerald-600">
                  Manajemen Sekolah
                </span>{' '}
                Anda
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-gray-500">
                Portal terintegrasi untuk presensi, tugas, dan fasilitas sekolah
                dalam satu platform modern. Tingkatkan efisiensi dan
                transparansi operasional harian.
              </p>

              <div className="mt-2 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95"
                >
                  Mulai Sekarang
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="#fitur"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200/80 bg-white/70 px-7 py-3.5 text-sm font-semibold text-emerald-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95"
                >
                  Pelajari Fitur
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {['AF', 'BS', 'CN'].map((initials, i) => (
                    <span
                      key={initials}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${
                        ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'][i]
                      }`}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <p className="max-w-[220px] text-sm leading-snug text-gray-500">
                  Dipercaya oleh{' '}
                  <span className="font-semibold text-gray-900">
                    100+ sekolah
                  </span>{' '}
                  di Indonesia
                </p>
              </div>
            </StaggerGroup>

            {/* CSS-built dashboard mockup */}
            <HeroMockup />
          </div>
        </motion.section>

        {/* ============ Showcase Carousel ============ */}
        <motion.section
          className="px-4 my-12 md:px-8 md:my-16"
          variants={itemVariants}
        >
          <ShowcaseCarousel />
        </motion.section>

        {/* ============ Features ============ */}
        <motion.section
          className="border-y border-gray-100 bg-slate-50/70 px-4 py-14 md:px-8 md:py-24"
          id="fitur"
          variants={itemVariants}
        >
          <div className="mx-auto max-w-7xl">
              <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Fitur Unggulan
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                Semua Kebutuhan Sekolah, Satu Platform
              </h2>
              <p className="text-lg leading-relaxed text-gray-500">
                Dirancang khusus untuk memenuhi kebutuhan manajemen sekolah
                modern dengan antarmuka yang intuitif dan mudah digunakan.
              </p>
            </div>

            <StaggerGroup
              as="ul"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  <Link
                    className="group block h-full"
                    href="/login"
                  >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-cta">
                      <span className="material-symbols-outlined icon-fill text-[28px]">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-gray-500">
                      {feature.description}
                    </p>
                    <span className="mt-6 inline-flex w-max items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                      {feature.tag}
                    </span>
                    <span className="mt-4 text-sm font-medium text-emerald-600 flex items-center gap-1">
                      Coba Fitur{' '}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </span>
                  </Link>
                </article>
              ))}
            </StaggerGroup>
          </div>
        </motion.section>

        {/* ============ Role Showcase (pinned scroll story) ============ */}
        <RoleShowcase />

        {/* ============ About ============ */}
        <motion.section
          className="px-4 py-14 md:px-8 md:py-24"
          id="tentang"
          variants={itemVariants}
        >
          <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
            <div className="order-2 flex flex-col gap-6 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Tentang Kami
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                Dibangun untuk Ekosistem Pendidikan Indonesia
              </h2>
              <p className="text-lg leading-relaxed text-gray-500">
                PantauSiswa menghubungkan siswa, guru, dan admin sekolah dalam
                satu alur kerja yang sama — mengurangi pekerjaan manual
                administrasi dan memberikan data yang akurat untuk pengambilan
                keputusan.
              </p>
              <ul className="flex flex-col gap-4">
                {[
                  {
                    icon: 'sync_alt',
                    title: 'Satu Sumber Data',
                    text: 'Presensi, izin, tugas, dan fasilitas tersinkron otomatis antar peran.',
                  },
                  {
                    icon: 'verified_user',
                    title: 'Aman & Terpercaya',
                    text: 'Data sekolah terenkripsi dengan kontrol akses berbasis peran.',
                  },
                  {
                    icon: 'devices',
                    title: 'Akses di Mana Saja',
                    text: 'Antarmuka responsif yang nyaman digunakan dari ponsel maupun desktop.',
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 ring-1 ring-inset ring-emerald-100">
                      <span className="material-symbols-outlined icon-fill text-[20px]">
                        {item.icon}
                      </span>
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        {item.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-md">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-100/70 via-transparent to-blue-100/70 blur-2xl"
                />
                <div className="relative rounded-3xl border border-white/60 bg-white/70 p-10 text-center shadow-glass-lg backdrop-blur-md">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
                    <span className="material-symbols-outlined icon-fill text-[44px]">
                      diversity_3
                    </span>
                  </div>
                  <blockquote className="text-lg font-medium leading-relaxed text-gray-700">
                    “Administrasi sekolah kami jauh lebih rapi sejak menggunakan
                    PantauSiswa.”
                  </blockquote>
                  <footer className="mt-6">
                    <p className="text-sm font-semibold text-gray-900">
                      Dra. Ratna Wijaya
                    </p>
                    <p className="text-sm text-gray-500">
                      Kepala Sekolah, SMA Negeri 12
                    </p>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ============ Stats ============ */}
        <motion.section
          className="px-4 pb-14 md:px-8 md:pb-24"
          variants={itemVariants}
        >
          <StaggerGroup
            className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4"
            stagger={0.12}
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="h-full rounded-2xl border border-white/60 bg-white/70 p-8 text-center shadow-glass backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </StaggerGroup>
        </motion.section>

        {/* ============ CTA band ============ */}
        <motion.section
          className="px-4 pb-14 md:px-8 md:pb-24"
          variants={itemVariants}
        >
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-12 text-center shadow-cta-lg sm:px-12 md:px-16 md:py-16">
            <ParallaxLayer
              aria-hidden="true"
              offset={35}
              className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            />
            <ParallaxLayer
              aria-hidden="true"
              offset={45}
              className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl"
            />
              <h2 className="relative mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Siap Membawa Sekolah Anda ke Level Berikutnya?
              </h2>
            <p className="relative mx-auto mb-8 max-w-xl text-lg text-emerald-50/90">
              Bergabunglah dengan ratusan sekolah yang telah menyederhanakan
              operasional harian mereka bersama PantauSiswa.
            </p>
            <Link
              href="/login"
              className="relative inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 active:scale-95"
            >
              Masuk ke Portal
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </motion.section>
      </motion.main>

      {/* ============ Footer ============ */}
      <footer className="border-t border-gray-100 bg-slate-50/70 px-4 py-10 md:px-8 md:py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              <span className="material-symbols-outlined icon-fill text-[20px]">
                school
              </span>
            </span>
            <span className="text-lg font-bold text-gray-900">PantauSiswa</span>
          </div>

          <nav
            aria-label="Tautan footer"
            className="flex flex-wrap justify-center gap-x-8 gap-y-3"
          >
            {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Kontak'].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="cursor-pointer text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600"
                >
                  {label}
                </a>
              ),
            )}
          </nav>

          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} PantauSiswa. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
    </SmoothScrollProvider>
  );
}
