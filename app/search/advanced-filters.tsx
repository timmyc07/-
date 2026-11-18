'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SlidersHorizontal } from '../action-icons.ts';
import DialogPanel from './dialog-panel.tsx';
import { LayoutLink } from './result-layout.tsx';

export default function AdvancedFilters({ children, checkTime }: { children: ReactNode; checkTime: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const panel = dialog.current!;
    const form = panel.closest('form');
    const close = () => panel.close();
    form?.addEventListener('submit', close);
    return () => form?.removeEventListener('submit', close);
  }, []);

  return <>
    {(checkTime || open) && <input type="hidden" name="availability" value="1" />}
    <button type="button" className="advanced-trigger" aria-label="進階篩選" title="進階篩選"
      aria-haspopup="dialog" onClick={(event) => {
        event.currentTarget.focus();
        dialog.current?.showModal();
        setOpen(true);
      }}><SlidersHorizontal size={19} aria-hidden="true" /></button>
    <DialogPanel dialog={dialog} className="advanced-dialog" title="進階篩選" onClose={() => {
      setOpen(false);
      setRevision((value) => value + 1);
    }}>
      <div className="inputs" key={revision}>{children}</div>
      <div className="search-actions">
        <LayoutLink className="clear-filters" href="/search#search" onClick={() => dialog.current?.close()}>清除所有查詢條件</LayoutLink>
        <button type="submit">套用篩選</button>
      </div>
    </DialogPanel>
  </>;
}
