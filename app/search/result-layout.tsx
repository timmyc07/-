'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { LayoutGrid, List } from '../action-icons.ts';
import { useLocationPermission } from './auto-distance.tsx';

export function LayoutField() {
  return useSearchParams().get('layout') === 'grid'
    ? <input type="hidden" name="layout" value="grid" />
    : null;
}

export function LayoutLink({ href, ...props }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const grid = useSearchParams().get('layout') === 'grid';
  const [path, hash] = href.split('#');
  const separator = path.includes('?') ? '&' : '?';
  return <Link prefetch={false} {...props} href={grid ? path + separator + 'layout=grid' + (hash ? '#' + hash : '') : href} />;
}

export function LayoutControls() {
  const grid = useSearchParams().get('layout') === 'grid';

  function setGrid(value: boolean) {
    if (value === grid) return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('layout', 'grid');
    else url.searchParams.delete('layout');
    window.history.pushState(null, '', url);
  }

  return <div className="result-layout" role="group" aria-label="結果顯示方式">
    <button type="button" aria-label="橫排清單" title="橫排清單" aria-pressed={!grid} onClick={() => setGrid(false)}><List size={18} /></button>
    <button type="button" aria-label="網格卡片" title="網格卡片" aria-pressed={grid} onClick={() => setGrid(true)}><LayoutGrid size={18} /></button>
  </div>;
}

export default function ResultLayout({ children, hasPosition }: { children: ReactNode; hasPosition: boolean }) {
  const section = useRef<HTMLElement>(null);
  const grid = useSearchParams().get('layout') === 'grid';
  const showDistance = useLocationPermission(hasPosition);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    });
    section.current?.querySelectorAll('.cards > .card:not([data-revealed])').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [children]);

  return <section ref={section} id="results" className="shell results" aria-label="查詢結果"
    data-layout={grid ? 'grid' : 'list'} data-show-distance={showDistance}>
    {children}
  </section>;
}
