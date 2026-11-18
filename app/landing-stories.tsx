import Link from 'next/link';
import { CalendarDays, ChevronRight } from './action-icons.ts';
import TaiwanCoverageMap from './taiwan-coverage-map.tsx';
import CardPhoto from './search/card-photo.tsx';
import type { RegionalLibrary } from '../lib/library-catalog.ts';
import { clock, weekdays } from '../lib/study.ts';

const showcaseIds = ['plis-6c9e30dc1c6abf7a17d4', 'plis-b4f11997a2a0f56cc70b'];

export default function LandingStories({ libraries, cityCount }: { libraries: RegionalLibrary[]; cityCount: number }) {
  const checked = libraries.flatMap((library) => {
    const area = library.areas.find((item) => item.kind === 'study' && item.slots?.length &&
      (item.access === 'walk-in' || item.access === 'card'));
    return area?.slots?.length ? [{ library, area, slot: area.slots[0] }] : [];
  });
  const photos = showcaseIds.flatMap((id) => libraries.filter((library) => library.id === id));
  const sampleHours = ['臺北市', '臺中市', '高雄市'].flatMap((city) => {
    const sample = checked.find(({ library }) => library.city === city);
    return sample ? [sample] : [];
  });

  return <div className="landing-stories">
    <section id="coverage" className="shell landing-story story-coverage" aria-labelledby="coverage-title">
      <div className="story-copy">
        <p className="story-number">{cityCount}</p>
        <h2 id="coverage-title">涵蓋縣市</h2>
        <p>從臺灣本島到離島，依縣市查找公立圖書館。</p>
      </div>
      <TaiwanCoverageMap />
    </section>

    <section id="directory" className="shell landing-story story-directory" aria-labelledby="directory-title">
      <div className="story-copy">
        <p className="story-number">{libraries.length}</p>
        <h2 id="directory-title">館舍名錄紀錄</h2>
        <p>依館名或地址找圖書館，查看館舍資訊、照片和導航。</p>
        <Link className="outline-link" href="/search?search=1#results">瀏覽全部館舍 <ChevronRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="story-visual story-photos">
        <div className="story-depth">
          {photos.map(({ id, name }) => <figure key={id} className="story-photo">
            <CardPhoto id={id} name={name} />
            <figcaption>{name}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>

    <section id="study-hours" className="shell landing-story story-hours" aria-labelledby="study-hours-title">
      <div className="story-copy">
        <p className="story-number">{checked.length}</p>
        <h2 id="study-hours-title">已核對自修時段的館舍</h2>
        <p>查詢指定日期和時段，並一起確認入場規則、設備和休館公告。</p>
        <Link className="outline-link" href="/search?search=1&availability=1#results">查詢自修時段 <ChevronRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="story-visual story-schedule">
        <div className="story-depth">
          {sampleHours.length > 0 && <>
            <h3><CalendarDays size={21} aria-hidden="true" />每週開放時段示例</h3>
            <ul>{sampleHours.map(({ library, area, slot }) => <li key={library.id}>
              <div><strong>{library.name}</strong><span>{area.name}</span></div>
              <span className="story-hour">週{weekdays[slot.day]} · {clock(slot.start)}–{clock(slot.end)}</span>
            </li>)}</ul>
          </>}
        </div>
      </div>
    </section>
  </div>;
}
