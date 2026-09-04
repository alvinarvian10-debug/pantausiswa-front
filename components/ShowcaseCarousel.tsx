'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';

interface Slide {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
  badge: string;
  iconChip: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'fact_check',
    title: 'Presensi Terpadu',
    description:
      'Pantau kehadiran siswa secara real-time dengan pencatatan digital yang akurat dan terintegrasi ke laporan wali kelas.',
    bullets: [
      'Check-in kehadiran sekali ketuk',
      'Rekap otomatis per kelas & sekolah',
      'Notifikasi keterlambatan instan',
    ],
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    iconChip: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: 'assignment_turned_in',
    title: 'Dispensasi & Izin',
    description:
      'Digitalisasi permohonan izin dan dispensasi siswa dengan alur persetujuan yang transparan dan cepat.',
    bullets: [
      'Ajukan izin lengkap dengan lampiran',
      'Persetujuan guru & admin terpadu',
      'Riwayat pengajuan terarsip rapi',
    ],
    badge: 'bg-teal-50 text-teal-700 ring-teal-100',
    iconChip: 'bg-teal-50 text-teal-500 ring-teal-100',
    gradient: 'from-teal-400 to-teal-600',
  },
  {
    icon: 'meeting_room',
    title: 'Peminjaman Fasilitas',
    description:
      'Booking ruangan, laboratorium, dan peralatan sekolah secara terpusat tanpa bentrok jadwal.',
    bullets: [
      'Kalender ketersediaan real-time',
      'Cegah bentrok jadwal otomatis',
      'QR code serah-terima aset',
    ],
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    iconChip: 'bg-cyan-50 text-cyan-500 ring-cyan-100',
    gradient: 'from-cyan-400 to-cyan-600',
  },
  {
    icon: 'folder_special',
    title: 'Pengumpulan Tugas',
    description:
      'Portal terpusat untuk distribusi dan pengumpulan tugas, memudahkan evaluasi oleh tenaga pendidik.',
    bullets: [
      'Distribusi tugas terjadwal',
      'Pengumpulan otomatis & terekam',
      'Penilaian terintegrasi dashboard',
    ],
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    iconChip: 'bg-emerald-50 text-emerald-500 ring-emerald-100',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: 'support_agent',
    title: 'Aduan Sekolah',
    description:
      'Sistem ticketing untuk pelaporan masalah fasilitas atau kendala administratif secara terstruktur.',
    bullets: [
      'Buat tiket aduan dalam seketika',
      'Pelacakan status transparan',
      'Eskalasi ke tim terkait otomatis',
    ],
    badge: 'bg-teal-50 text-teal-700 ring-teal-100',
    iconChip: 'bg-teal-50 text-teal-500 ring-teal-100',
    gradient: 'from-teal-400 to-teal-600',
  },
  {
    icon: 'monitoring',
    title: 'Analitik Sekolah',
    description:
      'Dashboard analitik untuk memantau tren kehadiran, performa kelas, dan operasional sekolah keseluruhan.',
    bullets: [
      'Grafik tren kehadiran harian',
      'Insight performa per kelas',
      'Ekspor laporan operasional',
    ],
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    iconChip: 'bg-cyan-50 text-cyan-500 ring-cyan-100',
    gradient: 'from-cyan-400 to-cyan-600',
  },
];

export default function ShowcaseCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [
      Autoplay({ delay: 5000, stopOnInteraction: false }),
      Fade(),
    ],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  return (
    <section className="px-6 py-16 md:py-24" id="fitur">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Jelajahi Fitur
        </p>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Satu Platform, Seluruh Kebutuhan Sekolah
        </h2>
        <p className="text-lg leading-relaxed text-gray-500">
          Gulir melalui keenam fitur unggulan yang dirancang untuk menyederhanakan
          operasional harian sekolah Anda.
        </p>
      </div>

      <div className="relative w-full max-w-7xl mx-auto min-h-[400px] md:min-h-[500px] overflow-hidden rounded-3xl bg-emerald-500/10 backdrop-blur-md border border-white/40 shadow-glass-lg">
        {/* Embla viewport */}
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {SLIDES.map((slide) => (
              <div
                key={slide.title}
                className="relative flex min-w-0 flex-[0_0_100%] items-center"
              >
                <div className="grid w-full items-center gap-10 px-6 py-12 md:grid-cols-2 md:gap-16 md:px-16 md:py-20">
                  {/* Copy */}
                  <div className="flex flex-col gap-5">
                    <span
                      className={`inline-flex w-max items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${slide.badge}`}
                    >
                      <span className="material-symbols-outlined icon-fill text-[18px]">
                        {slide.icon}
                      </span>
                      {slide.title}
                    </span>
                    <h3 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                      {slide.description}
                    </h3>
                    <ul className="mt-2 flex flex-col gap-3">
                      {slide.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm font-medium text-gray-700"
                        >
                          <span className="material-symbols-outlined icon-fill mt-0.5 text-[18px] text-emerald-500">
                            check_circle
                          </span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mockup */}
                  <div className="relative mx-auto w-full max-w-sm">
                    <div
                      aria-hidden="true"
                      className={`absolute -inset-6 rounded-[2rem] bg-gradient-to-br ${slide.gradient} opacity-[0.10] blur-2xl`}
                    />
                    <div className="relative flex aspect-[4/3] flex-col justify-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-glass backdrop-blur-md">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      </div>
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${slide.gradient} text-white shadow-cta`}
                      >
                        <span className="material-symbols-outlined icon-fill text-[28px]">
                          {slide.icon}
                        </span>
                      </div>
                      <div className="mt-1 rounded-xl border border-gray-100 bg-white/80 p-3 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900">
                          {slide.title}
                        </p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-full w-2/3 rounded-full bg-gradient-to-r ${slide.gradient}`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-8 flex-1 rounded-lg border border-gray-100 bg-white/80 shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrows — hidden on mobile */}
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Sebelumnya"
          className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 text-emerald-600 shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-glass-lg md:flex"
        >
          <span className="material-symbols-outlined text-[22px]">
            chevron_left
          </span>
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Berikutnya"
          className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 text-emerald-600 shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-glass-lg md:flex"
        >
          <span className="material-symbols-outlined text-[22px]">
            chevron_right
          </span>
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ke slide ${index + 1}`}
              aria-current={index === selectedIndex}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'w-7 bg-emerald-500'
                  : 'w-2.5 bg-white/70 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
