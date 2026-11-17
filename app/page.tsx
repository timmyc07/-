import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from './action-icons.ts';
import DataTransparency from './data-transparency.tsx';
import { libraryCatalog } from '../lib/library-catalog.ts';
import directory from '../public/datasets/library-directory.json';

export default async function LandingPage({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  if (params.search === '1') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'sources' && typeof value === 'string') query.set(key, value);
    }
    redirect('/search?' + query + '#results');
  }
  const { libraries, snapshot } = await libraryCatalog();
  const checked = libraries.filter(({ areas }) => areas.some((area) =>
    area.kind === 'study' && area.slots?.length && (area.access === 'walk-in' || area.access === 'card'))).length;

  return <main className="landing">
    <section className="shell hero" aria-labelledby="landing-title">
      <div className="hero-copy">
        <p className="eyebrow">全臺公立圖書館自修查詢</p>
        <h1 id="landing-title">找一個時段，<br />安靜讀書。</h1>
        <p className="intro">按時段、入場規則與設備找到合適的自修空間，出發前先看館方資訊。</p>
        <div className="hero-actions">
          <Link className="primary-action" href="/search"><Search size={18} />查詢自修空間</Link>
          <a href="#sources">查看資料來源 ↓</a>
        </div>
      </div>
      <Image className="hero-image" src="/library-reading-room.webp" alt="午後陽光照進圖書館閱覽室，長桌旁排列著木質書架"
        width={1200} height={800} sizes="(max-width: 760px) 100vw, 52vw" preload />
    </section>
    <section className="shell" aria-label="資料收錄範圍">
      <dl className="coverage-stats">
        <div><dt>涵蓋縣市</dt><dd>{Object.keys(directory.cityCounts).length}</dd></div>
        <div><dt>館舍名錄紀錄</dt><dd>{libraries.length}</dd></div>
        <div><dt>已核對自修時段的館舍</dt><dd>{checked}</dd></div>
      </dl>
    </section>
    <DataTransparency libraries={libraries} snapshot={snapshot} expanded={params.sources === '1'} />
  </main>;
}
