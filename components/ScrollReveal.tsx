'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  /**
   * Stagger delay in seconds (e.g. 0.1 for the 2nd card, 0.2 for the 3rd).
   * Also applied to the reduced-motion fallback so rhythm is preserved.
   */
  delay?: number;
  /** Passthrough classes — use `h-full` when wrapping grid children that stretch. */
  className?: string;
}

/**
 * Accessibility-aware scroll-reveal.
 *
 * - Default: subtle slide-up (opacity 0→1, y 20→0) with a smooth spring,
 *   triggered once when the element enters the viewport.
 * - `prefers-reduced-motion`: translate movement is disabled and only a
 *   simple opacity fade plays, honoring the user's OS-level setting via
 *   Framer Motion's `useReducedMotion()`.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  className,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={
        shouldReduceMotion
          ? { duration: 0.4, ease: 'easeOut', delay }
          : { type: 'spring', stiffness: 100, damping: 20, delay }
      }
    >
      {children}
    </motion.div>
  );
}
