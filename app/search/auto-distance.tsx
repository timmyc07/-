'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

let locationRequest: Promise<string | undefined> | undefined;

export function useLocationPermission(hasPosition: boolean) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!hasPosition) return;
    let active = true;
    let permission: PermissionStatus | undefined;
    const update = () => setGranted(permission?.state === 'granted');

    async function check() {
      try {
        permission = await navigator.permissions.query({ name: 'geolocation' });
        if (!active) return;
        update();
        permission.addEventListener('change', update);
      } catch {
        const position = await locationRequest;
        if (active) setGranted(Boolean(position));
      }
    }

    void check();
    return () => {
      active = false;
      permission?.removeEventListener('change', update);
    };
  }, [hasPosition]);

  return hasPosition && granted;
}

export default function AutoDistance({ searchKey }: { searchKey: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!navigator.geolocation) return;

    let active = true;
    const url = new URL(window.location.href);
    locationRequest ??= new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        resolve(coords.latitude.toFixed(3) + ',' + coords.longitude.toFixed(3));
      }, () => resolve(undefined), { timeout: 8000 });
    });
    void locationRequest.then((position) => {
      if (!position || !active) return;
      const current = new URL(window.location.href);
      const originalParams = new URLSearchParams(url.search);
      const currentParams = new URLSearchParams(current.search);
      originalParams.delete('layout');
      currentParams.delete('layout');
      if (current.pathname !== url.pathname || currentParams.toString() !== originalParams.toString()) return;
      current.searchParams.set('position', position);
      router.replace('/search' + current.search + current.hash, { scroll: false });
    });
    return () => { active = false; };
  }, [router, searchKey]);

  return null;
}
