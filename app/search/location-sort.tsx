'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MapPin } from '../action-icons.ts';

export default function LocationSort({ hasPosition }: { hasPosition: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  function navigate(url: URL, position?: string) {
    if (position) url.searchParams.set('position', position);
    else url.searchParams.delete('position');
    url.searchParams.set('search', '1');
    url.searchParams.delete('page');
    startTransition(() => router.push('/search' + url.search + '#results'));
  }

  function toggleLocation() {
    setMessage('');
    const origin = new URL(window.location.href);
    if (hasPosition) {
      navigate(origin);
      return;
    }
    if (!navigator.geolocation) {
      setMessage('此瀏覽器無法提供定位。');
      return;
    }
    setLocating(true);
    origin.searchParams.delete('layout');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocating(false);
      const current = new URL(window.location.href);
      const filters = new URLSearchParams(current.search);
      filters.delete('layout');
      if (current.pathname === origin.pathname && filters.toString() === origin.searchParams.toString()) {
        navigate(current, coords.latitude.toFixed(3) + ',' + coords.longitude.toFixed(3));
      }
    }, (error) => {
      setLocating(false);
      setMessage(error.code === 1 ? '定位權限未開啟，仍可使用其他查詢條件。' : '暫時無法定位，請再試一次。');
    }, { timeout: 8000 });
  }

  return <>
    <button type="button" className="outline-link" disabled={locating || pending} onClick={toggleLocation}>
      <MapPin size={16} aria-hidden="true" />
      {locating ? '定位中…' : hasPosition ? '取消定位排序' : '以我的位置排序'}
    </button>
    {message && <p className="distance-note" role="status">{message}</p>}
  </>;
}
