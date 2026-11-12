import Link from 'next/link';
import { connection } from 'next/server';
import { taichungSnapshot } from '../../lib/mongodb.ts';
import { coverageGaps } from '../../lib/study.ts';

export default async function Admin() {
  await connection();
  let snapshot;
  try {
    snapshot = await taichungSnapshot();
  } catch {
    return <main className="shell"><Link href="/">← 返回查詢</Link><p role="alert">目前無法連線至 MongoDB。</p></main>;
  }
  if (!snapshot) return <main className="shell"><Link href="/">← 返回查詢</Link><p>臺中資料尚未匯入。</p></main>;
  const rows = new Map<string, { directory: number; areas: number; checked: number; contact: number; noStudy: number }>();
  for (const library of snapshot.libraries) {
    const row = rows.get(library.district) ?? { directory: 0, areas: 0, checked: 0, contact: 0, noStudy: 0 };
    row.directory++;
    if (library.phone) row.contact++;
    if (library.studyRoom === false) row.noStudy++;
    if (library.areas.length) row.areas++;
    if (library.areas.some((area) => area.slots?.length && area.access)) row.checked++;
    rows.set(library.district, row);
  }
  const gaps = snapshot.libraries.filter((library) => coverageGaps(library).length).length;
  return <main className="shell admin">
    <Link href="/">← 返回查詢</Link>
    <h1>臺中公立圖書館資料狀態</h1>
    <p>最近匯入 {new Date(snapshot.importedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
    <ul>
      <li><a href="https://data.gov.tw/dataset/83865">臺中市政府聯絡資訊</a> · {snapshot.sourceCounts.city} 筆原始資料</li>
      <li><a href="https://www.library.taichung.gov.tw/">臺中市立圖書館官網</a> · {snapshot.sourceCounts.branches} 個館舍入口</li>
      <li><a href="https://data.gov.tw/dataset/99567">公共圖書館基本資料</a> · {snapshot.sourceCounts.publicLibraries} 筆臺中公立圖書館資料</li>
    </ul>
    <p>{gaps} 筆館舍仍有待核對欄位。<a href="/admin/gaps">下載逐館缺口清單（CSV）</a></p>
    {snapshot.issues.length > 0 && <><h2>匯入待查</h2><ul>{snapshot.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></>}
    <div className="table-wrap"><table>
      <caption>各行政區館舍與自修規則核對進度</caption>
      <thead><tr><th scope="col">行政區</th><th scope="col">名錄</th><th scope="col">有電話</th><th scope="col">無自修室</th><th scope="col">已辨識空間</th><th scope="col">已核對時段及資格</th></tr></thead>
      <tbody>{[...rows.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hant')).map(([name, row]) =>
        <tr key={name}><th scope="row">{name || '待確認'}</th><td>{row.directory}</td><td>{row.contact}</td><td>{row.noStudy}</td><td>{row.areas}</td><td>{row.checked}</td></tr>)}</tbody>
    </table></div>
  </main>;
}
