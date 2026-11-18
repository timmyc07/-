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
  const sorted = parseCoordinates(urlPosition ?? undefined) !== undefined;
  const [error, setError] = useState<keyof typeof locationMessages>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (sorted) return;
    let active = true;
    void locate().then((result) => {
      if (!active) return;
      if ('error' in result) {
        setError(result.error);
        return;
      }
      const url = new URL(window.location.href);
      if (url.pathname !== '/search' || parseCoordinates(url.searchParams.get('position') ?? undefined)) return;
      url.searchParams.set('position', result.position);
      router.replace('/search' + url.search + url.hash, { scroll: false });
    });
    return () => { active = false; };
  }, [attempt, router, sorted]);

  return <div className="result-tools location-sort">
    <span role="status">
      {sorted ? '已依查詢位置排序' : error ? locationMessages[error] : '正在定位並依距離排序…'}
    </span>
    {!sorted && error && error !== 'unsupported' && <button className="outline-link" type="button" onClick={() => {
      setError(undefined);
      setAttempt((value) => value + 1);
    }}>重新定位</button>}
  </div>;
}
