import Link from 'next/link';
import { Database } from './action-icons.ts';
import SourceGroup from './source-group.tsx';
import details from '../public/datasets/library-details.json';
import directory from '../public/datasets/library-directory.json';
import { sourcesByHost } from '../lib/source-catalog.ts';
import type { Library, Snapshot } from '../lib/study.ts';

const date = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'medium' });

export default function DataTransparency({ libraries, snapshot, expanded }: {
  libraries: Library[];
  snapshot: Snapshot | null;
  expanded: boolean;
}) {
  const groups = expanded ? sourcesByHost(libraries, snapshot) : [];

  return <section id="sources" className="data-transparency" aria-labelledby="sources-title">
    <div className="shell">
      <div className="transparency-heading">
        <div><h2 id="sources-title">資料透明</h2><p>查看館舍資料從哪裡來、何時更新，以及哪些欄位仍待核對。</p></div>
        <Link className="outline-link" href="/admin">查看資料狀態 →</Link>
      </div>
      <div className="transparency-layout">
        <nav className="transparency-nav" aria-label="資料透明章節">
          <a href="#official-sources">公開資料來源</a>
          <a href="#data-downloads">資料下載</a>
          <a href="#updates-and-licenses">更新與授權</a>
          <a href="#source-index">逐館來源索引</a>
        </nav>
        <div className="transparency-content">
          <section id="official-sources">
            <h3>公開資料來源</h3>
            <ul>
              <li><a href={directory.source}>國資圖公共圖書館基本資料</a></li>
              <li><a href={directory.download}>全臺名錄來源 API</a></li>
              <li><a href="https://data.gov.tw/dataset/83865">臺中市公共圖書館聯絡資訊</a></li>
              <li><a href="https://www.library.taichung.gov.tw/">臺中市立圖書館館舍與公告</a></li>
            </ul>
          </section>
          <section id="data-downloads">
            <h3>資料下載</h3>
            <ul>
              <li><a href={'/datasets/' + directory.rawFile} download>全臺館舍原始名錄（JSON）</a></li>
              <li><a href="/datasets/library-directory.json" download>全臺館舍整理名錄（JSON）</a></li>
              <li><a href="/datasets/library-details.json" download>館舍開放時間與設施（JSON）</a></li>
              {snapshot && <li><a href="/admin/gaps">臺中逐館核對缺口（CSV）</a></li>}
            </ul>
          </section>
          <section id="updates-and-licenses">
            <h3>更新與授權</h3>
            <dl className="source-dates">
              <div><dt>全臺名錄更新</dt><dd><time dateTime={directory.collectedAt}>{date.format(new Date(directory.collectedAt))}</time></dd></div>
              <div><dt>館舍資料更新</dt><dd><time dateTime={details.collectedAt}>{date.format(new Date(details.collectedAt))}</time></dd></div>
              {snapshot && <div><dt>臺中核對匯入</dt><dd><time dateTime={snapshot.importedAt}>{date.format(new Date(snapshot.importedAt))}</time></dd></div>}
            </dl>
            <ul>
              <li><a href="https://data.gov.tw/license">政府資料開放授權條款第 1 版</a></li>
              <li><a href="/licenses/pulsoicon.txt">PulsoIcon 圖示授權</a></li>
            </ul>
          </section>
          <section id="source-index" className="footer-index">
            <h3>逐館來源索引</h3>
            <Link className="outline-link" href={expanded ? '/#source-index' : '/?sources=1#source-index'} prefetch={false} aria-expanded={expanded}>
              <Database size={16} />{expanded ? '收合逐館來源索引' : '查看完整逐館來源索引'}
            </Link>
            {groups.map(([host, links]) => <SourceGroup key={host} host={host} count={links.size} />)}
          </section>
        </div>
      </div>
    </div>
  </section>;
}
