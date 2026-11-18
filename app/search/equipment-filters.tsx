'use client';

import { useRef, type ReactNode } from 'react';

export default function EquipmentFilters({ children }: { children: ReactNode }) {
  const submit = useRef<HTMLButtonElement>(null);

  return <fieldset aria-label="需要的設備" onChange={(event) => {
    const button = submit.current;
    if (button) event.currentTarget.form?.requestSubmit(button);
  }}>
    <div className="checks">{children}</div>
    <button type="submit" formAction="/search#search" ref={submit} hidden />
  </fieldset>;
}
