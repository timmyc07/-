'use client';

import { useState } from 'react';

type SourceLinks = [url: string, label: string][];

export default function SourceGroup({ host, count }: { host: string; count: number }) {
  const [links, setLinks] = useState<SourceLinks>();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadLinks() {
    if (links || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/sources?host=' + encodeURIComponent(host));
      if (!response.ok) throw new Error('Could not load source links');
      setLinks(await response.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return <details onToggle={(event) => { if (event.currentTarget.open) void loadLinks(); }}>
    <summary>{host} · {count} 筆</summary>
    <div className="disclosure-body" aria-busy={loading}>
      {loading && <p role="status">載入來源中…</p>}
      {failed && <p>來源載入失敗。 <button type="button" onClick={loadLinks}>重試</button></p>}
      {links && <ul>{links.map(([url, label]) => <li key={url}><a href={url}>{label}</a></li>)}</ul>}
    </div>
  </details>;
}
