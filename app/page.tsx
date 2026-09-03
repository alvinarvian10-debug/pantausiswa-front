import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import HeroMockup from '../components/HeroMockup';
import SmoothScrollProvider from '../components/SmoothScrollProvider';
import ParallaxLayer from '../components/ParallaxLayer';
import AnimatedCounter from '../components/AnimatedCounter';
import StaggerGroup from '../components/StaggerGroup';
import RoleShowcase from '../components/RoleShowcase';
import ShowcaseCarousel from '../components/ShowcaseCarousel';

const STATS = [
  { value: 100, suffix: '+', label: 'Sekolah Pengguna' },
  { value: 50, suffix: 'k+', label: 'Siswa Aktif' },
  { value: 99, suffix: '%', label: 'Uptime Server' },
  { value: 24, suffix: '/7', label: 'Dukungan Teknis' },
];

export default function BerandaPage() {
  return (
    <SmoothScrollProvider>
    <div className="flex min-h-screen flex-col bg-white text-gray-600">
      <SiteHeader />

      <main className="flex-grow">
        {/* ============ Hero ============ */}
        <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pb-32 md:pt-24">
          <ParallaxLayer
            aria-hidden="true"
            offset={50}
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl sm:-right-40 sm:-top-40 sm:h-[480px] sm:w-[480px]"
          />
          <ParallaxLayer
            aria-hidden="true"
            offset={80}
            className="pointer-events-none absolute -left-20 top-40 h-56 w-56 rounded-full bg-blue-50/80 blur-3xl sm:-left-48 sm:top-64 sm:h-[420px] sm:w-[420px]"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
            <StaggerGroup
              as="div"
              className="flex flex-col gap-7"
              itemClassName=""
              stagger={0.12}
            >
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
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
        </section>

        {/* ============ Showcase Carousel ============ */}
        <ShowcaseCarousel />

        {/* ============ Role Showcase (pinned scroll story) ============ */}
        <RoleShowcase />

        {/* ============ About ============ */}
        <section className="px-6 py-24" id="tentang">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
            <div className="order-2 flex flex-col gap-6 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Tentang Kami
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
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
        </section>

        {/* ============ Stats ============ */}
        <section className="px-6 pb-24">
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
        </section>

        {/* ============ CTA band ============ */}
        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-16 text-center shadow-cta-lg sm:px-16">
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
            <h2 className="relative mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
        </section>
      </main>

      {/* ============ Footer ============ */}
      <footer className="border-t border-gray-100 bg-slate-50/70 px-6 py-12">
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
