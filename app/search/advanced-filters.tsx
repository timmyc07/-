'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { SlidersHorizontal, X } from '../action-icons.ts';
import { LayoutLink } from './result-layout.tsx';

function isBackdrop({ target, currentTarget, clientX, clientY }: MouseEvent<HTMLDialogElement>) {
  if (target !== currentTarget) return false;
  const { left, top, right, bottom } = currentTarget.getBoundingClientRect();
  return clientX < left || clientX > right || clientY < top || clientY > bottom;
}

export default function AdvancedFilters({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
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
    <dialog ref={dialog} className="advanced-dialog" aria-labelledby="advanced-title"
      onPointerDown={(event) => { pressedBackdrop.current = isBackdrop(event); }}
      onClick={(event) => {
        if (pressedBackdrop.current && isBackdrop(event)) event.currentTarget.close();
        pressedBackdrop.current = false;
      }}
      onClose={() => setRevision((value) => value + 1)}>
      <button type="button" className="dialog-close" aria-label="關閉進階篩選" onClick={() => dialog.current?.close()}>
        <X size={21} aria-hidden="true" />
      </button>
      <div className="dialog-content">
        <h2 id="advanced-title">進階篩選</h2>
        <div className="inputs" key={revision}>{children}</div>
        <div className="search-actions">
          <LayoutLink className="clear-filters" href="/search#search" onClick={() => dialog.current?.close()}>清除條件</LayoutLink>
          <button type="submit">套用篩選</button>
        </div>
      </div>
    </dialog>
  </>;
}
