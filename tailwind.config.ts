import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        glass: 'rgba(255,255,255,0.70)',
      },
      maxWidth: {
        content: '1440px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 23, 42, 0.06)',
        'glass-lg': '0 16px 48px rgba(15, 23, 42, 0.10)',
        'cta': '0 8px 20px -6px rgba(16, 185, 129, 0.45)',
        'cta-lg': '0 12px 28px -6px rgba(16, 185, 129, 0.55)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'draw-line': {
          from: { 'stroke-dashoffset': '140' },
          to: { 'stroke-dashoffset': '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'draw-line': 'draw-line 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
