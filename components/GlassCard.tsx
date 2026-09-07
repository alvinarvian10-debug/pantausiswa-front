import { ComponentPropsWithoutRef, ReactNode } from 'react';

interface GlassCardProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
}

/* Reusable Glassmorphism wrapper.
   Base glass classes per design2.md:
   bg-white/70 backdrop-blur-md border border-white/40 shadow-sm
   Passes through any other div props (aria-hidden, role, etc.) untouched. */
export default function GlassCard({
  children,
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-md border border-white/40 shadow-sm rounded-2xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
