'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import Link from 'next/link';

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: string;
  accent: string;
  mockup: 'attendance' | 'approval' | 'booking' | 'tasks' | 'tickets' | 'chart';
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Real-time',
    title: 'Presensi Terpadu',
    description:
      'Pantau kehadiran siswa secara real-time dengan pencatatan digital yang akurat dan terintegrasi dengan laporan wali kelas.',
    cta: 'Lihat Demo',
    icon: 'fact_check',
    accent: 'from-emerald-400/30 to-teal-400/10',
    mockup: 'attendance',
  },
  {
    eyebrow: 'Otomatis',
    title: 'Dispensasi & Izin',
    description:
      'Digitalisasi permohonan izin dan dispensasi siswa dengan alur persetujuan yang transparan dan cepat.',
    cta: 'Pelajari Fitur',
    icon: 'assignment_turned_in',
    accent: 'from-blue-400/30 to-cyan-400/10',
    mockup: 'approval',
  },
  {
    eyebrow: 'Terpusat',
    title: 'Peminjaman Fasilitas',
    description:
      'Booking ruangan, laboratorium, dan peralatan sekolah secara terpusat tanpa bentrok jadwal.',
    cta: 'Lihat Demo',
    icon: 'meeting_room',
    accent: 'from-amber-400/30 to-orange-400/10',
    mockup: 'booking',
  },
  {
    eyebrow: 'Effisien',
    title: 'Pengumpulan Tugas',
    description:
      'Portal terpusat untuk distribusi dan pengumpulan tugas, memudahkan evaluasi oleh tenaga pendidik.',
    cta: 'Pelajari Fitur',
    icon: 'folder_special',
    accent: 'from-violet-400/30 to-fuchsia-400/10',
    mockup: 'tasks',
  },
  {
    eyebrow: 'Helpdesk',
    title: 'Aduan Sekolah',
    description:
      'Sistem ticketing untuk pelaporan masalah fasilitas atau kendala administratif secara terstruktur.',
    cta: 'Lihat Demo',
    icon: 'support_agent',
    accent: 'from-rose-400/30 to-pink-400/10',
    mockup: 'tickets',
  },
  {
    eyebrow: 'Insight',
    title: 'Analitik Sekolah',
    description:
      'Dashboard analitik untuk memantau tren kehadiran, performa kelas, dan operasional sekolah keseluruhan.',
    cta: 'Coba Sekarang',
    icon: 'monitoring',
    accent: 'from-sky-400/30 to-indigo-400/10',
    mockup: 'chart',
  },
];

function MockupContent({ slide }: { slide: Slide }) {
  const shell =
    'relative rounded-3xl border border-white/60 bg-white/70 p-6 shadow-glass-lg backdrop-blur-md';
  const glow =
    'absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-white/60 to-transparent blur-2xl';

  if (slide.mockup === 'attendance') {
    return (
      <div className={shell}>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2.5 w-24 rounded-full bg-emerald-200/70" />
          <span className="ml-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            96% Hadir
          </span>
        </div>
        <div className="space-y-3">
          {['Ananda', 'Bunga', 'Citra'].map((name, i) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/60 px-4 py-3"
            >
              <span className="h-8 w-8 rounded-full bg-emerald-100" />
              <div className="flex-1 text-sm font-medium text-gray-700">
                {name}
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <span className="material-symbols-outlined text-[16px]">
                  {i === 1 ? 'schedule' : 'check'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.mockup === 'approval') {
    return (
      <div className={shell}>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2.5 w-24 rounded-full bg-blue-200/70" />
          <span className="ml-auto rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
            Menunggu
          </span>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/60 p-4">
          <p className="text-sm font-semibold text-gray-800">Izin Sakit</p>
          <p className="mt-1 text-xs text-gray-500">Bunga · 2 hari</p>
          <div className="mt-4 flex gap-2">
            <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 py-2 text-xs font-semibold text-white">
              <span className="material-symbols-outlined text-[16px]">
                check
              </span>
              Setuju
            </span>
            <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-400/80 py-2 text-xs font-semibold text-white">
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
              Tolak
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (slide.mockup === 'booking') {
    return (
      <div className={shell}>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2.5 w-24 rounded-full bg-amber-200/70" />
          <span className="ml-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            Tersedia
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Lab 1', 'R.102', 'Aula'].map((room, i) => (
            <div
              key={room}
              className={`rounded-xl border border-white/60 px-3 py-4 text-center text-xs font-semibold ${
                i === 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/60 text-gray-600'
              }`}
            >
              {room}
            </div>
          ))}
          {['R.205', 'Studio', 'Perpust'].map((room) => (
            <div
              key={room}
              className="rounded-xl border border-white/60 bg-white/40 px-3 py-4 text-center text-xs font-semibold text-gray-400"
            >
              {room}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.mockup === 'tasks') {
    return (
      <div className={shell}>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2.5 w-24 rounded-full bg-violet-200/70" />
          <span className="ml-auto rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700">
            3/4 Selesai
          </span>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Matematika', pct: '80%' },
            { name: 'Biologi', pct: '55%' },
            { name: 'Sejarah', pct: '30%' },
          ].map((t) => (
            <div key={t.name} className="rounded-xl border border-white/60 bg-white/60 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-700">
                <span>{t.name}</span>
                <span>{t.pct}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-violet-500"
                  style={{ width: t.pct }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.mockup === 'tickets') {
    return (
      <div className={shell}>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2.5 w-24 rounded-full bg-rose-200/70" />
          <span className="ml-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            #142 Solved
          </span>
        </div>
        <div className="space-y-3">
          <div className="ml-auto w-3/4 rounded-2xl rounded-tr-sm bg-emerald-500 px-4 py-2 text-xs font-medium text-white">
            AC ruang kelas bocor
          </div>
          <div className="w-3/4 rounded-2xl rounded-tl-sm bg-white/70 px-4 py-2 text-xs font-medium text-gray-600">
            Terima kasih, sedang ditangani.
          </div>
          <div className="ml-auto w-2/3 rounded-2xl rounded-tr-sm bg-emerald-500 px-4 py-2 text-xs font-medium text-white">
            Baik, ditunggu.
          </div>
        </div>
      </div>
    );
  }

  // chart
  return (
    <div className={shell}>
      <div className="mb-5 flex items-center gap-3">
        <span className="h-2.5 w-24 rounded-full bg-sky-200/70" />
        <span className="ml-auto rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700">
          Mingguan
        </span>
      </div>
      <div className="flex h-32 items-end justify-between gap-3 px-2">
        {[40, 70, 55, 90, 65, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg bg-gradient-to-t from-sky-500 to-indigo-400"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ShowcaseCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false }), Fade()],
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
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  // Pause the auto-play while the cursor is over the carousel so the active
  // card stays put ("diam ditempat"), then resume on mouse-leave.
  const onMouseEnter = useCallback(() => {
    emblaApi?.plugins()?.autoplay?.stop();
  }, [emblaApi]);
  const onMouseLeave = useCallback(() => {
    emblaApi?.plugins()?.autoplay?.play();
  }, [emblaApi]);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-full max-w-7xl mx-auto min-h-[400px] md:min-h-[500px] overflow-hidden rounded-3xl relative shadow-glass-lg"
    >
      {/* Ambient gradient backdrop so the glass reads well */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-100/70 via-slate-50 to-blue-100/70" />

      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className="embla__slide min-w-0 flex-[0_0_100%] p-3 sm:p-5"
            >
              <div
                className={`group flex h-full min-h-[400px] md:min-h-[460px] flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-6 backdrop-blur-md transition-all duration-500 hover:bg-white/50 sm:p-10 md:flex-row md:items-center md:gap-10 md:p-12 ${slide.accent} bg-gradient-to-br`}
              >
                {/* Text side */}
                <div className="flex flex-1 flex-col justify-center">
                  <span className="mb-4 inline-flex w-max items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
                    {slide.eyebrow}
                  </span>
                  <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                    {slide.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
                    {slide.description}
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 active:scale-95"
                    >
                      {slide.cta}
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Mockup side */}
                <div className="mt-10 flex flex-1 items-center justify-center md:mt-0">
                  <div className="relative w-full max-w-sm">
                    <div
                      aria-hidden="true"
                      className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-white/60 to-transparent blur-2xl"
                    />
                    <div className="relative flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 px-6 py-4 shadow-glass-lg backdrop-blur-md">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
                        <span className="material-symbols-outlined icon-fill text-[26px]">
                          {slide.icon}
                        </span>
                      </span>
                      <div className="h-2.5 w-24 rounded-full bg-emerald-200/70" />
                    </div>
                    <div className="mt-4">
                      <MockupContent slide={slide} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next floating controls */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Slide sebelumnya"
        className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/60 text-gray-700 shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-emerald-600 hover:shadow-glass-lg md:flex"
      >
        <span className="material-symbols-outlined text-[22px]">
          chevron_left
        </span>
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Slide berikutnya"
        className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/60 text-gray-700 shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-emerald-600 hover:shadow-glass-lg md:flex"
      >
        <span className="material-symbols-outlined text-[22px]">
          chevron_right
        </span>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Pergi ke slide ${index + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'w-8 bg-emerald-500'
                : 'w-2.5 bg-emerald-500/30 hover:bg-emerald-500/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
