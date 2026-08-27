import GlassCard from './GlassCard';
import ScrollReveal from './ScrollReveal';

interface PagePlaceholderProps {
  /** Material Symbols icon name shown next to the title and inside the card. */
  icon: string;
  title: string;
  description: string;
}

/**
 * Shared layout for feature sub-pages that are not yet implemented:
 * a page header (icon + title + description) followed by a tall
 * glassmorphism "under development" card, both revealed on scroll.
 */
export default function PagePlaceholder({
  icon,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className="mx-auto w-full max-w-content flex-1 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Page header */}
        <ScrollReveal>
          <header className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-inset ring-emerald-100">
              <span className="material-symbols-outlined icon-fill text-[28px]">
                {icon}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
                {description}
              </p>
            </div>
          </header>
        </ScrollReveal>

        {/* Under-development card */}
        <ScrollReveal delay={0.1}>
          <GlassCard className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden gap-6 p-8 text-center">
            {/* Decorative background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100/50 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none material-symbols-outlined icon-fill absolute -bottom-10 right-4 select-none text-[200px] leading-none text-emerald-500/5"
            >
              {icon}
            </span>

            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
              <span className="material-symbols-outlined icon-fill text-[44px]">
                construction
              </span>
            </div>

            <div className="relative z-10 max-w-md space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 ring-1 ring-inset ring-amber-100">
                <span className="material-symbols-outlined icon-fill text-[14px]">
                  hourglass_empty
                </span>
                Segera Hadir
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
                Fitur {title} sedang dalam pengembangan.
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                Tim kami sedang menyelesaikan modul ini agar Anda dapat
                menggunakannya secepatnya. Silakan kembali lagi nanti.
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </main>
  );
}
