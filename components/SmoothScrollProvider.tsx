'use client';

import { ReactLenis } from 'lenis/react';
import { ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

/**
 * Wraps the landing page in a Lenis smooth-scroll instance.
 *
 * Deliberately scoped to `/` only (imported directly in `app/page.tsx`) —
 * NOT placed in the root layout. The dashboard scrolls an internal
 * `overflow-y-auto` panel rather than the window, so Lenis would have
 * nothing to smooth there; `/login` doesn't need it either since people
 * land there to finish a task quickly, not to enjoy the scroll.
 *
 * `root` mode drives real `window`/`document` scrolling (via rAF-interpolated
 * native scrollTop, not a CSS-transform hijack), so `position: sticky`
 * sections — like `RoleShowcase` — keep working correctly, and existing
 * `window.scrollY` listeners (see `SiteHeader`) and Framer Motion's
 * `useScroll()` keep receiving real scroll updates.
 *
 * `prefers-reduced-motion` is honored twice, belt-and-suspenders: Lenis's
 * own `respectReducedMotion` (on by default) neutralizes the easing curve,
 * and — matching the guard already used in `ScrollReveal`/`TiltCard` — we
 * skip mounting Lenis entirely so reduced-motion users get plain native
 * scroll with zero smoothing JS in the loop.
 */
export default function SmoothScrollProvider({
  children,
}: SmoothScrollProviderProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        duration: 1.1,
        easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic — matches ScrollReveal's spring "settle" feel
        wheelMultiplier: 1,
        touchMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}
