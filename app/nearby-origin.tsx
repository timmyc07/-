'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Crosshair } from 'pulsoicon-react/icons/crosshair';
import { Compass } from './action-icons.ts';

type OriginLibrary = { id: string; name: string };

export default function NearbyOrigin({ selectedLibrary, initialOrigin, position }: {
  selectedLibrary?: OriginLibrary;
  initialOrigin: string;
  position?: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin);
  const [libraries, setLibraries] = useState<OriginLibrary[]>();
  const [libraryStatus, setLibraryStatus] = useState<'idle' | 'loading' | 'failed'>('idle');
  const loadingLibraries = useRef(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  async function loadLibraries() {
    if (libraries || loadingLibraries.current) return;
    loadingLibraries.current = true;
    setLibraryStatus('loading');
    try {
      const response = await fetch('/api/nearby-origins', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Could not load distance origins');
      setLibraries(await response.json());
      setLibraryStatus('idle');
    } catch {
      setLibraryStatus('failed');
    } finally {
      loadingLibraries.current = false;
    }
  }

  function locate(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form!;
    if (!form.reportValidity()) return;
    if (!navigator.geolocation) {
      setMessage('此瀏覽器無法定位，請選擇一間圖書館作為起點。');
      return;
    }
    setLocating(true);
    setMessage('正在取得位置…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const params = new URLSearchParams();
      new FormData(form).forEach((value, key) => params.set(key, String(value)));
      params.delete('city');
      params.delete('district');
      params.set('near', 'me');
      params.set('position', coords.latitude.toFixed(3) + ',' + coords.longitude.toFixed(3));
      params.set('search', '1');
      setLocating(false);
      setMessage('');
      router.push('/search?' + params + '#results');
    }, (error) => {
      setLocating(false);
      setMessage(error.code === error.PERMISSION_DENIED
        ? '未取得定位權限，請選擇一間圖書館作為起點。'
        : '目前無法取得位置，請重試或選擇一間圖書館作為起點。');
    }, { timeout: 8000 });
  }

  return <div className="nearby-origin">
    <label><span className="filter-label"><Compass size={16} />距離排序起點</span>
      <select name="near" value={origin} onChange={(event) => setOrigin(event.target.value)}
        onFocus={loadLibraries} onPointerEnter={loadLibraries} aria-busy={libraryStatus === 'loading'}>
      <option value="">請選擇距離起點</option>
      {position && <option value="me">我的位置</option>}
      {(libraries ?? (selectedLibrary ? [selectedLibrary] : [])).map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      {libraryStatus === 'loading' && <option disabled>載入館舍中…</option>}
    </select></label>
    {origin === 'me' && position && <input type="hidden" name="position" value={position} />}
    <button type="button" onClick={locate} disabled={locating}><Crosshair className="action-icon" size={18} />使用我的位置查詢</button>
    {libraryStatus === 'failed' && <button type="button" onClick={loadLibraries}>重試載入館舍</button>}
    <span role="status">{message}</span>
  </div>;
}
