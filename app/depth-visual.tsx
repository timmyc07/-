'use client';

import type { PointerEvent, ReactNode } from 'react';

export default function DepthVisual({ className, children }: { className: string; children: ReactNode }) {
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = event.currentTarget;
    const { left, top, width, height } = stage.getBoundingClientRect();
    stage.style.setProperty('--tilt-x', `${((top + height / 2 - event.clientY) / height * 14).toFixed(1)}deg`);
    stage.style.setProperty('--tilt-y', `${((event.clientX - left - width / 2) / width * 18).toFixed(1)}deg`);
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.removeProperty('--tilt-x');
    event.currentTarget.style.removeProperty('--tilt-y');
  }

  return <div className={'story-visual ' + className} onPointerMove={tilt} onPointerLeave={reset}>
    <div className="story-depth">{children}</div>
  </div>;
}
