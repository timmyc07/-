'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

let pendingLocation: Promise<string | undefined> | undefined;

function locate() {
  pendingLocation ??= new Promise<string | undefined>((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      resolve(coords.latitude.toFixed(3) + ',' + coords.longitude.toFixed(3));
    }, () => resolve(undefined), { timeout: 8000 });
  }).finally(() => { pendingLocation = undefined; });
  return pendingLocation;
}

export default function AutoDistance() {
  const router = useRouter();
  const urlPosition = useSearchParams().get('position');
  const [position, setPosition] = useState<string | null>();

  useEffect(() => {
    let active = true;
    void locate().then((value) => {
      if (active) setPosition(value ?? null);
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

  return null;
}
