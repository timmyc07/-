import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from './action-icons.ts';
import DataTransparency from './data-transparency.tsx';
import TaiwanConstellation from './taiwan-constellation.tsx';
import { libraryCatalog } from '../lib/library-catalog.ts';
import { projectTaiwan } from '../lib/taiwan-map.ts';
import directory from '../public/datasets/library-directory.json';

export default async function LandingPage({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  if (params.search === '1') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'sources' && key !== 'photos' && typeof value === 'string') query.set(key, value);
    }
    redirect('/search?' + query + '#results');
  }
  const { libraries, snapshot } = await libraryCatalog();
  const checked = libraries.filter(({ areas }) => areas.some((area) =>
    area.kind === 'study' && area.slots?.length && (area.access === 'walk-in' || area.access === 'card'))).length;
  const libraryLocations = libraries.flatMap(({ coordinates }) => coordinates
    ? [projectTaiwan(coordinates.longitude, coordinates.latitude)] : []);

  return <main className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="shell hero">
        <div className="hero-copy">
          <p className="eyebrow">全臺公立圖書館自修查詢</p>
          <h1 id="landing-title">找一個時段，<span>安靜讀書。</span></h1>
          <p className="intro">按時段、入場規則與設備查找圖書館自修空間。</p>
          <div className="hero-actions">
            <Link className="primary-action" href="/search" prefetch><Search size={18} aria-hidden="true" />查詢自修空間</Link>
            <a href="#sources">查看資訊總覽 <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <TaiwanConstellation libraries={libraryLocations} />
      </div>
    </section>
    <section className="shell landing-coverage" aria-label="資料收錄範圍">
      <dl className="coverage-stats">
        <div><dt>涵蓋縣市</dt><dd>{Object.keys(directory.cityCounts).length}</dd></div>
        <div><dt>館舍名錄紀錄</dt><dd>{libraries.length}</dd></div>
        <div><dt>已核對自修時段的館舍</dt><dd>{checked}</dd></div>
      </dl>
    </section>
    <DataTransparency libraries={libraries} snapshot={snapshot} expanded={params.sources === '1'}
      photosExpanded={params.photos === '1'} />
  </main>;
}
