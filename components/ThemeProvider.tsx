'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'pantausiswa.theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage tak tersedia — abaikan.
  }
  return null;
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  // Inisialisasi setelah mount: ikuti preferensi tersimpan, lalu sistem.
  useEffect(() => {
    setThemeState(readStoredTheme() ?? (prefersDark() ? 'dark' : 'light'));
  }, []);

  // Terapkan class + simpan + sinkron meta theme-color.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // abaikan
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#020617' : '#f8fafc');
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    setThemeState(next);
    window.setTimeout(() => root.classList.remove('theme-transition'), 400);
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    window.setTimeout(() => root.classList.remove('theme-transition'), 400);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}