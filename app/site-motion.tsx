'use client';

import { motion, useScroll } from 'motion/react';
import type { ReactNode } from 'react';

// Adapted from Magic UI's Blur Fade and Scroll Progress (MIT).
const initial = { opacity: 0.78, y: 10 };
const reveal = { opacity: 1, y: 0 };
const transition = { duration: 0.34, ease: 'easeOut' } as const;

export function BlurFade({ children, className, inView = false, as = 'div' }: {
  children: ReactNode;
  className?: string;
  inView?: boolean;
  as?: 'div' | 'article';
}) {
  const Element = as === 'article' ? motion.article : motion.div;
  return <Element className={className ? 'motion-reveal ' + className : 'motion-reveal'} initial={initial}
    animate={inView ? undefined : reveal} whileInView={inView ? reveal : undefined}
    viewport={{ once: true, amount: 0.1 }} transition={transition}>{children}</Element>;
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="scroll-progress" aria-hidden="true" style={{ scaleX: scrollYProgress }} />;
}
