'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseCoordinates } from '../../lib/distance.ts';

const locationMessages = {
  denied: '請在瀏覽器允許定位後重試。',
  timeout: '定位逾時，請重試。',
  unavailable: '暫時無法取得位置，請重試。',
  unsupported: '此瀏覽器無法使用定位。',
};

type LocationResult = { position: string } | { error: keyof typeof locationMessages };
let pendingLocation: Promise<LocationResult> | undefined;

function locate() {
  pendingLocation ??= new Promise<LocationResult>((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: 'unsupported' });
      return;
    }

    function request(retry: boolean) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        resolve({ position: coords.latitude.toFixed(3) + ',' + coords.longitude.toFixed(3) });
      }, (error) => {
        if (error.code === error.PERMISSION_DENIED) resolve({ error: 'denied' });
        else if (retry) request(false);
        else resolve({ error: error.code === error.TIMEOUT ? 'timeout' : 'unavailable' });
      }, { maximumAge: 60_000, timeout: retry ? 8_000 : 12_000 });
    }

    request(true);
  }).finally(() => { pendingLocation = undefined; });
  return pendingLocation;
}

export default function AutoDistance() {
  const router = useRouter();
  const urlPosition = useSearchParams().get('position');
  const [result, setResult] = useState<LocationResult>();
  const position = result && ('position' in result ? result.position : result.error === 'denied' ? null : undefined);

  useEffect(() => {
    let active = true;
    void locate().then((value) => {
      if (active) setResult(value);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (position === undefined || position === urlPosition) return;
    const url = new URL(window.location.href);
    if (url.pathname !== '/search' || url.searchParams.get('position') === position) return;
    if (position) url.searchParams.set('position', position);
    else url.searchParams.delete('position');
    url.searchParams.delete('page');
    router.replace('/search' + url.search + url.hash, { scroll: false });
  }, [position, router, urlPosition]);

  const error = result && 'error' in result ? result.error : undefined;
  const sorted = parseCoordinates(urlPosition ?? undefined) !== undefined;

  return <div className="result-tools location-sort">
    <span role="status">
      {error
        ? (sorted && error !== 'denied' ? '仍依上次定位排序。' : '') + locationMessages[error]
        : sorted && (!position || position === urlPosition) ? '已依目前位置排序' : '正在定位並依距離排序…'}
    </span>
    {error && error !== 'unsupported' && <button className="outline-link" type="button" onClick={() => {
      setResult(undefined);
      void locate().then(setResult);
    }}>重新定位</button>}
  </div>;
}
