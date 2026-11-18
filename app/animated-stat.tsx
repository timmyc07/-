'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedStat({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const count = ref.current;
    if (!count || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    let frame = 0;
    function animate(start: number, current: number) {
      const progress = Math.min(1, (current - start) / 900);
      if (count) count.textContent = String(motion.matches ? value : Math.round(value * (1 - .72 * (1 - progress) ** 3)));
      if (progress < 1 && !motion.matches) frame = requestAnimationFrame((time) => animate(start, time));
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < .5) return;
      observer.disconnect();
      frame = requestAnimationFrame((time) => animate(time, time));
    }, { threshold: .5 });
    observer.observe(count);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <p className="story-number">
    <span aria-hidden="true" ref={ref}>{value}</span><span className="story-number-label">{value}</span>
  </p>;
}
