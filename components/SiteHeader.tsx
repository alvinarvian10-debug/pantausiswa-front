'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#tentang', label: 'Tentang Kami' },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-gray-100 bg-white/80 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="PantauSiswa - Beranda">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
            <span className="material-symbols-outlined icon-fill text-[20px]">school</span>
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-900">PantauSiswa</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-cta-lg active:scale-95 sm:inline-flex sm:items-center sm:gap-2"
          >
            Login
            <span className="material-symbols-outlined text-[18px]">login</span>
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[24px]">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-md transition-[max-height] duration-300 ease-out md:hidden ${
          menuOpen ? 'max-h-64' : 'max-h-0 border-t-0'
        }`}
      >
        <nav aria-label="Navigasi seluler" className="flex flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-medium text-white shadow-cta transition-colors hover:bg-emerald-600"
          >
            Login
            <span className="material-symbols-outlined text-[18px]">login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
