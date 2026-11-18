'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LibraryBig } from '../action-icons.ts';

export function CardPhotoPlaceholder({ loading = false }: { loading?: boolean }) {
  return <div className="card-photo card-photo-placeholder" aria-hidden={loading || undefined}>
    <LibraryBig size={28} aria-hidden="true" />{loading ? '照片載入中…' : '暫無館舍照片'}
  </div>;
}

export default function CardPhoto({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  if (failed) return <CardPhotoPlaceholder />;

  return <div className="card-photo card-photo-frame" data-ready={ready}>
    <CardPhotoPlaceholder loading />
    <Image src={'/api/library-photos/' + encodeURIComponent(id)} alt={name + '館舍實景'}
      fill unoptimized onLoad={() => setReady(true)} onError={() => setFailed(true)} />
  </div>;
}
