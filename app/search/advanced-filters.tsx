'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw, SlidersHorizontal } from '../action-icons.ts';
import { LayoutLink } from './result-layout.tsx';

export default function AdvancedFilters({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const panel = dialog.current!;
    const form = panel.closest('form');
    const close = () => panel.close();
    form?.addEventListener('submit', close);
    return () => form?.removeEventListener('submit', close);
  }, []);

  return <>
    <button type="button" className="advanced-trigger" aria-label="進階篩選" title="進階篩選"
      aria-haspopup="dialog" onClick={(event) => {
        event.currentTarget.focus();
        dialog.current?.showModal();
      }}><SlidersHorizontal size={19} aria-hidden="true" /></button>
    <dialog ref={dialog} className="advanced-dialog" aria-labelledby="advanced-title" onClose={() => setRevision((value) => value + 1)}>
      <h2 id="advanced-title">進階篩選</h2>
      <div className="inputs" key={revision}>{children}</div>
      <div className="search-actions">
        <LayoutLink className="filter-label" href="/search#search" onClick={() => dialog.current?.close()}><RotateCcw size={16} />清除條件</LayoutLink>
        <button type="button" className="dialog-cancel" onClick={() => dialog.current?.close()}>取消</button>
        <button type="submit">套用篩選</button>
      </div>
    </dialog>
  </>;
}
