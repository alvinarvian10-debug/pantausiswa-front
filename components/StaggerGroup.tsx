'use client';

import {
  Children,
  isValidElement,
  ReactNode,
  type AriaAttributes,
} from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface StaggerGroupProps extends AriaAttributes {
  children: ReactNode;
  id?: string;
  /** Grid/layout classes — this component IS the container, so put e.g. `grid grid-cols-3 gap-6` here. */
  className?: string;
  /** Render as a semantic list (`ul` > `li`) or a plain container (`div` > `div`). */
  as?: 'div' | 'ul';
  /** Seconds between each child's reveal. */
  stagger?: number;
  /** Classes applied to each item wrapper — default `h-full` so grid cards stretch evenly. */
  itemClassName?: string;
}

/**
 * Sibling to `ScrollReveal`, for the common case of a grid/list of cards
 * that should reveal in sequence instead of all at once. Uses the same
 * spring feel as `ScrollReveal` so the two read as one motion language.
 *
 * Replaces the previous per-item pattern of manually computing
 * `delay={(index % n) * 0.1}` on individual `ScrollReveal`s — wrap the
 * whole list once instead:
 *
 * ```tsx
 * <StaggerGroup as="ul" className="grid grid-cols-3 gap-6">
 *   {items.map((item) => <li key={item.id}>...</li>)}
 * </StaggerGroup>
 * ```
 *
 * Any other props (`aria-label`, `role`, ...) pass straight through to the
 * container element.
 */
export default function StaggerGroup({
  children,
  className,
  as = 'div',
  stagger = 0.1,
  itemClassName = 'h-full',
  ...rest
}: StaggerGroupProps) {
  const shouldReduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.4, ease: 'easeOut' }
        : { duration: 0.6, ease: 'easeOut' },
    },
  };

  const Container = as === 'ul' ? motion.ul : motion.div;
  const Item = as === 'ul' ? motion.li : motion.div;

  return (
    <Container
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      {...rest}
    >
      {Children.map(children, (child) =>
        isValidElement(child) ? (
          <Item variants={item} className={itemClassName}>
            {child}
          </Item>
        ) : (
          child
        ),
      )}
    </Container>
  );
}
