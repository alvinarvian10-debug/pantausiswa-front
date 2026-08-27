'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
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
 * Accessibility-aware reveal-on-mount.
 *
 * - Default: subtle slide-up (opacity 0→1, y 20→0) with a smooth ease-out,
 *   played once when the component first mounts (i.e. on initial page load).
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

  const variants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.4, ease: 'easeOut', delay }
        : { duration: 0.6, ease: 'easeOut', delay },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
