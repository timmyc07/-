'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MouseEvent } from 'react';

export default function NearbyOrigin({ libraries, initialOrigin, position }: {
  libraries: { id: string; name: string }[];
  initialOrigin: string;
  position?: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

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
      router.push('/?' + params + '#results');
    }, (error) => {
      setLocating(false);
      setMessage(error.code === error.PERMISSION_DENIED
        ? '未取得定位權限，請選擇一間圖書館作為起點。'
        : '目前無法取得位置，請重試或選擇一間圖書館作為起點。');
    }, { timeout: 8000 });
  }

  return <div className="nearby-origin">
    <label>距離排序起點<select name="near" value={origin} onChange={(event) => setOrigin(event.target.value)}>
      <option value="">不按距離排序</option>
      {position && <option value="me">我的位置</option>}
      {libraries.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    {origin === 'me' && position && <input type="hidden" name="position" value={position} />}
    <button type="button" onClick={locate} disabled={locating}>使用我的位置查詢</button>
    <small>使用我的位置時，會搜尋全臺並保留其他查詢條件。</small>
    <span role="status">{message}</span>
  </div>;
}
