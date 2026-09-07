'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Subtle premium 3D tilt on hover (scale 1.02, rotateX 2°, rotateY -2°).
 * Disabled entirely when `prefers-reduced-motion` is set — no transforms
 * are applied in that case, keeping the card static.
 */
export default function TiltCard({ children, className }: TiltCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={shouldReduceMotion ? undefined : { transformPerspective: 1200 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { scale: 1.02, rotateX: 2, rotateY: -2 }
      }
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
