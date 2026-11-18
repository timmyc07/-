import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from './action-icons.ts';
import DataTransparency from './data-transparency.tsx';
import LandingStories from './landing-stories.tsx';
import { libraryCatalog } from '../lib/library-catalog.ts';
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

  return <main className="landing">
    <section className="shell hero" aria-labelledby="landing-title">
      <div className="hero-copy">
        <p className="eyebrow">全臺公立圖書館自修查詢</p>
        <h1 id="landing-title">找一個時段，<br />安靜讀書。</h1>
        <p className="intro">按時段、入場規則與設備找到合適的自修空間，出發前先看館方資訊。</p>
        <div className="hero-actions">
          <Link className="primary-action" href="/search" prefetch><Search size={18} />查詢自修空間</Link>
          <a href="#coverage">探索館舍分布 ↓</a>
        </div>
      </div>
      <div className="hero-media">
        <Image className="hero-image" src="/library-reading-room.webp" alt="午後陽光照進圖書館閱覽室，長桌旁排列著木質書架"
          width={1200} height={800} sizes="(max-width: 1228px) 100vw, 1180px" preload />
      </div>
    </section>
    <LandingStories libraries={libraries} cityCount={Object.keys(directory.cityCounts).length} />
    <DataTransparency libraries={libraries} snapshot={snapshot} expanded={params.sources === '1'}
      photosExpanded={params.photos === '1'} />
  </main>;
}
