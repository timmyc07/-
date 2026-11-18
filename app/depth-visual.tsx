'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

export default function DepthVisual({ className, children }: { className: string; children: ReactNode }) {
  const frame = useRef(0);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (frame.current || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { currentTarget: stage, clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const { left, top, width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      stage.style.setProperty('--tilt-x', `${((top + height / 2 - clientY) / height * 14).toFixed(1)}deg`);
      stage.style.setProperty('--tilt-y', `${((clientX - left - width / 2) / width * 18).toFixed(1)}deg`);
    });
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    event.currentTarget.style.removeProperty('--tilt-x');
    event.currentTarget.style.removeProperty('--tilt-y');
  }

  return <div className={'story-visual ' + className} onPointerMove={tilt} onPointerLeave={reset}>
    <div className="story-depth">{children}</div>
  </div>;
}
