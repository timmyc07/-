import Link from 'next/link';
import { connection } from 'next/server';
import { taichungSnapshot } from '../../lib/mongodb.ts';
import directory from '../../public/datasets/library-directory.json';
import { coverageGaps } from '../../lib/study.ts';

export default async function Admin() {
  await connection();
  const snapshot = await taichungSnapshot().catch(() => null);
  const rows = new Map<string, { directory: number; areas: number; checked: number; contact: number; noStudy: number }>();
  for (const library of snapshot?.libraries ?? []) {
    const row = rows.get(library.district) ?? { directory: 0, areas: 0, checked: 0, contact: 0, noStudy: 0 };
    row.directory++;
    if (library.phone) row.contact++;
    if (library.studyRoom === false) row.noStudy++;
    if (library.areas.length) row.areas++;
    if (library.areas.some((area) => area.slots?.length && area.access)) row.checked++;
    rows.set(library.district, row);
  }
  const gaps = snapshot?.libraries.filter((library) => coverageGaps(library).length).length;
  return <main className="shell admin">
    <Link href="/#sources">← 返回資訊總覽</Link>
    <h1>全臺公立圖書館資料狀態</h1>
    <section aria-labelledby="directory-title">
      <h2 id="directory-title">全臺館舍名錄</h2>
      <p>{Object.keys(directory.cityCounts).length} 個縣市 · {directory.count} 筆館舍 · 擷取時間 {new Date(directory.collectedAt)
        .toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
      <ul>
        <li><a href={directory.source}>國立公共資訊圖書館「公共圖書館基本資料」</a>（政府資料開放授權條款第 1 版）</li>
        <li><a href={'/datasets/' + directory.rawFile} download>下載官方原始 JSON</a> · {directory.rawCount} 筆來源紀錄</li>
        <li><a href="/datasets/library-directory.json" download>下載 StudyGo 整理後的館舍名錄（JSON）</a> · 縣市筆數、排除紀錄和原始檔雜湊</li>
      </ul>
      <details><summary>各縣市名錄筆數</summary>
        <div className="disclosure-body">
          <ul className="city-counts">{Object.entries(directory.cityCounts).map(([name, count]) =>
            <li key={name}>{name} {count} 筆</li>)}</ul>
        </div>
      </details>
    </section>
    <section className="audit-history" aria-labelledby="taichung-title">
      <h2 id="taichung-title">臺中自修規則核對</h2>
      <p>這裡顯示臺中的逐欄核對進度。全臺查詢也會使用其他縣市已收錄的館舍與空間規則。</p>
      {snapshot ? <>
        <p>最近匯入 {new Date(snapshot.importedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
        <ul>
          <li><a href="https://data.gov.tw/dataset/83865">臺中市政府聯絡資訊</a> · {snapshot.sourceCounts.city} 筆原始資料</li>
          <li><a href="https://www.library.taichung.gov.tw/">臺中市立圖書館官網</a> · {snapshot.sourceCounts.branches} 個館舍入口</li>
          <li><a href="https://data.gov.tw/dataset/99567">公共圖書館基本資料</a> · {snapshot.sourceCounts.publicLibraries} 筆臺中公立圖書館資料</li>
        </ul>
        <p>{gaps} 筆館舍仍有待核對欄位。 <Link href="/admin/fields">逐欄核對與匯入異動</Link> · <a href="/admin/gaps">下載逐館缺口清單（CSV）</a></p>
        {snapshot.issues.length > 0 && <><h2>匯入待查</h2><ul>{snapshot.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></>}
        <div className="table-wrap"><table>
          <caption>各行政區館舍與自修規則核對進度</caption>
          <thead><tr><th scope="col">行政區</th><th scope="col">名錄</th><th scope="col">有電話</th><th scope="col">無自修室</th><th scope="col">已辨識空間</th><th scope="col">已核對時段及資格</th></tr></thead>
          <tbody>{[...rows.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hant')).map(([name, row]) =>
            <tr key={name}><th scope="row">{name || '待確認'}</th><td>{row.directory}</td><td>{row.contact}</td><td>{row.noStudy}</td><td>{row.areas}</td><td>{row.checked}</td></tr>)}</tbody>
        </table></div>
      </> : <p role="status">目前無法讀取臺中核對快照，全臺館舍名錄仍可查詢。</p>}
    </section>
  </main>;
}
