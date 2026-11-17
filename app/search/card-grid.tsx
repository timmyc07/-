'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

export default function CardGrid({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const grid = useSearchParams().get('layout') === 'grid';
  const revealed = useMemo(() => new WeakSet<Element>(), [grid]);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      const rows = [...new Set(visible.map(({ target }) => (target as HTMLElement).offsetTop))].sort((a, b) => a - b);
      for (const { target } of visible) {
        observer.unobserve(target);
        revealed.add(target);
        target.setAttribute('data-revealed', '');
        target.getAnimations().find((animation) => animation.id === 'card-entry')?.cancel();
        const row = rows.indexOf((target as HTMLElement).offsetTop);
        target.animate([{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], {
          id: 'card-entry', duration: 420, delay: Math.min(row, 4) * 85, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'backwards',
        });
      }
    });
    container.current?.querySelectorAll('.card').forEach((card) => {
      if (!revealed.has(card)) observer.observe(card);
    });
    return () => observer.disconnect();
  }, [children, revealed]);

  return <div className="cards" ref={container}>{children}</div>;
}
