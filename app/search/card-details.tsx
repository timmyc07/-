'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight } from '../action-icons.ts';
import DialogPanel from './dialog-panel.tsx';

export default function CardDetails({ name, children }: { name: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    if (loaded) dialog.current?.showModal();
  }, [loaded]);

  return <>
    <button type="button" className="card-details-trigger" aria-label={'查看' + name + '詳情'} aria-haspopup="dialog" onClick={(event) => {
      event.currentTarget.focus();
      if (loaded) dialog.current?.showModal();
      else setLoaded(true);
    }}>查看詳情 <ChevronRight size={14} aria-hidden="true" /></button>
    <DialogPanel dialog={dialog} className="library-dialog" title={name}>
      {loaded && children}
    </DialogPanel>
  </>;
}
