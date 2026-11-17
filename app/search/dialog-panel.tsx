'use client';

import { useId, useRef } from 'react';
import type { MouseEvent, ReactNode, RefObject } from 'react';
import { X } from '../action-icons.ts';

function isBackdrop({ target, currentTarget, clientX, clientY }: MouseEvent<HTMLDialogElement>) {
  if (target !== currentTarget) return false;
  const { left, top, right, bottom } = currentTarget.getBoundingClientRect();
  return clientX < left || clientX > right || clientY < top || clientY > bottom;
}

export default function DialogPanel({ dialog, className, title, children, onClose }: {
  dialog: RefObject<HTMLDialogElement | null>;
  className: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const titleId = useId();
  const pressedBackdrop = useRef(false);

  return <dialog ref={dialog} className={'animated-dialog ' + className} aria-labelledby={titleId}
    onPointerDown={(event) => { pressedBackdrop.current = isBackdrop(event); }}
    onClick={(event) => {
      if (pressedBackdrop.current && isBackdrop(event)) event.currentTarget.close();
      pressedBackdrop.current = false;
    }}
    onClose={onClose}>
    <button type="button" className="dialog-close" aria-label="關閉對話框" onClick={() => dialog.current?.close()}>
      <X size={21} aria-hidden="true" />
    </button>
    <div className="dialog-content">
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  </dialog>;
}
