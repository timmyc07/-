'use client';

import { useRef } from 'react';

export default function DurationField({ minutes }: { minutes: number }) {
  const input = useRef<HTMLInputElement>(null);

  return <div className="duration-field">
    <label htmlFor="duration">使用時長（分鐘）</label>
    <div className="duration-control">
      <input ref={input} id="duration" type="number" name="duration" min="1" max="1440" defaultValue={minutes} required />
      <div className="duration-steps">
        <button type="button" aria-label="增加一分鐘" onClick={() => input.current?.stepUp()} />
        <button type="button" aria-label="減少一分鐘" onClick={() => input.current?.stepDown()} />
      </div>
    </div>
  </div>;
}
