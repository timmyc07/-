'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import CardGrid from './card-grid.tsx';

type Batch = { cards: ReactNode[]; nextPage: number | null };

export default function InfiniteResults({ initial, loadPage }: {
  initial: Batch;
  loadPage: (page: number) => Promise<Batch>;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const requestedPage = useRef<number | null>(null);
  const [additional, setAdditional] = useState<ReactNode[]>([]);
  const [nextPage, setNextPage] = useState(initial.nextPage);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');

  const loadMore = useCallback(async () => {
    if (nextPage === null || requestedPage.current === nextPage) return;
    requestedPage.current = nextPage;
    setStatus('loading');
    try {
      const batch = await loadPage(nextPage);
      setAdditional((cards) => [...cards, ...batch.cards]);
      setNextPage(batch.nextPage);
      setStatus('ready');
    } catch {
      requestedPage.current = null;
      setStatus('error');
    }
  }, [loadPage, nextPage]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || status !== 'ready' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: '160px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, status]);

  return <>
    <CardGrid>{initial.cards}{additional}</CardGrid>
    {nextPage !== null && <div className="more-results" ref={sentinel}>
      {status === 'loading' ? <p role="status">載入更多館舍…</p> :
        <button type="button" onClick={loadMore}>{status === 'error' ? '載入失敗，重試' : '載入更多'}</button>}
    </div>}
  </>;
}
