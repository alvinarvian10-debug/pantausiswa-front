'use client';

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { useRef, type AriaAttributes } from 'react';

interface ParallaxLayerProps extends AriaAttributes {
  id?: string;
  className?: string;
  /**
   * Vertical travel in pixels as the element crosses the viewport.
   * Keep small (40–120) — this is background depth, not a headline effect.
   */
  offset?: number;
}

/**
 * Moves an element a little slower/faster than the page as it scrolls,
 * purely for background depth (decorative blur blobs). Tracks the
 * element's OWN progress through the viewport, so it behaves the same
 * regardless of where it sits on the page or how long the page is.
 *
 * Usage: pass the blob's OWN classes (including its `absolute -right-40
 * -top-40 ...` positioning) straight into `className` — this component
 * renders that single element directly rather than wrapping it, so the
 * transform doesn't create a new containing block that would shift where
 * `absolute` resolves against.
 *
 * Reserved for decorative, `aria-hidden` elements — never wrap real
 * content in this, parallaxing text/UI hurts readability more than it adds.
 */
export default function ParallaxLayer({
  offset = 60,
  className,
  ...rest
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={shouldReduceMotion ? undefined : { y }}
      {...rest}
    />
  );
}
