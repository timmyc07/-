import Link from 'next/link';
import details from '../public/datasets/library-details.json';
import directory from '../public/datasets/library-directory.json';
import { sourcesByHost } from '../lib/source-catalog.ts';
import type { Library, Snapshot } from '../lib/study.ts';

const date = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'medium' });

export default function SiteFooter({ libraries, snapshot, indexHref, expanded }: {
  libraries: Library[];
  snapshot: Snapshot | null;
  indexHref: string;
  expanded: boolean;
}) {
  const groups = expanded ? sourcesByHost(libraries, snapshot) : [];

  return <footer id="sources" className="site-footer" aria-labelledby="sources-title">
    <div className="shell">
      <h2 id="sources-title">資料來源與授權</h2>
      <div className="footer-columns">
        <section>
          <h3>公開資料來源</h3>
          <ul>
            <li><a href={directory.source}>國資圖公共圖書館基本資料</a></li>
            <li><a href={directory.download}>全臺名錄來源 API</a></li>
            <li><a href="https://data.gov.tw/dataset/83865">臺中市公共圖書館聯絡資訊</a></li>
            <li><a href="https://www.library.taichung.gov.tw/">臺中市立圖書館館舍與公告</a></li>
          </ul>
        </section>
        <section>
          <h3>資料下載</h3>
          <ul>
            <li><a href={'/datasets/' + directory.rawFile} download>全臺館舍原始名錄（JSON）</a></li>
            <li><a href="/datasets/library-directory.json" download>全臺館舍整理名錄（JSON）</a></li>
            <li><a href="/datasets/library-details.json" download>館舍開放時間與設施（JSON）</a></li>
            {snapshot && <li><a href="/admin/gaps">臺中逐館核對缺口（CSV）</a></li>}
          </ul>
        </section>
        <section>
          <h3>更新與授權</h3>
          <ul>
            <li>全臺名錄更新 <time dateTime={directory.collectedAt}>{date.format(new Date(directory.collectedAt))}</time></li>
            <li>館舍資料更新 <time dateTime={details.collectedAt}>{date.format(new Date(details.collectedAt))}</time></li>
            {snapshot && <li>臺中核對匯入 <time dateTime={snapshot.importedAt}>{date.format(new Date(snapshot.importedAt))}</time></li>}
            <li><a href="https://data.gov.tw/license">政府資料開放授權條款第 1 版</a></li>
            <li><Link href="/admin">資料狀態與逐欄核對</Link></li>
          </ul>
        </section>
      </div>
      <div className="footer-index">
        <Link href={indexHref} prefetch={false}>{expanded ? '收合逐館來源索引' : '查看完整逐館來源索引'}</Link>
        {expanded && groups.map(([host, links]) => <details key={host}>
          <summary>{host} · {links.size} 筆</summary>
          <div className="disclosure-body">
            <ul>{[...links].map(([url, label]) => <li key={url}><a href={url}>{label}</a></li>)}</ul>
          </div>
        </details>)}
      </div>
    </div>
  </footer>;
}
