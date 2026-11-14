import Link from 'next/link';
import { auditRows, fieldLabels, type FieldReview } from '../../../lib/field-audit.ts';
import { taichungSnapshot } from '../../../lib/mongodb.ts';

const taipeiDateTime = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei',
  dateStyle: 'short', timeStyle: 'short' });

export default async function FieldAudit({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { library, field, status } = await searchParams;
  let snapshot;
  try {
    snapshot = await taichungSnapshot();
  } catch {
    return <main className="shell admin"><Link href="/admin">← 資料狀態</Link>
      <p role="alert">目前無法連線至 MongoDB。</p></main>;
  }
  if (!snapshot) return <main className="shell admin"><Link href="/admin">← 資料狀態</Link>
    <p>臺中資料尚未匯入。</p></main>;

  const selected = snapshot.libraries.find(({ id }) => id === library);
  const selectedField = typeof field === 'string' && Object.hasOwn(fieldLabels, field) ? field : '';
  const pending = status === 'pending';
  const rows = auditRows(snapshot.libraries, snapshot.fieldReviews).sort((a, b) =>
    Number(b.libraryId === 'tc-123') - Number(a.libraryId === 'tc-123'));
  const visible = rows.filter((row) => (!selected || row.libraryId === selected.id) &&
    (!selectedField || row.field === selectedField) && (!pending || row.value === null));
  const history = (snapshot.fieldHistory ?? []).map((batch) => ({ ...batch,
    changes: batch.changes.filter((change) => (!selected || change.libraryId === selected.id) &&
      (!selectedField || change.field === selectedField)),
  })).filter(({ changes }) => changes.length);

  return <main className="shell admin">
    <Link href="/admin">← 資料狀態</Link>
    <h1>臺中館舍逐欄核對</h1>
    <p>最近匯入 <time dateTime={snapshot.importedAt}>{taipeiDateTime.format(new Date(snapshot.importedAt))}</time></p>
    <form className="audit-filters" method="get" action="/admin/fields">
      <div className="inputs">
        <label>館舍<select name="library" defaultValue={selected?.id ?? ''}>
          <option value="">全部館舍</option>
          {snapshot.libraries.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <label>欄位<select name="field" defaultValue={selectedField}>
          <option value="">全部欄位</option>
          {Object.entries(fieldLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <label>狀態<select name="status" defaultValue={pending ? 'pending' : ''}>
          <option value="">全部狀態</option><option value="pending">待確認</option>
        </select></label>
      </div>
      <button type="submit">套用篩選</button>
    </form>
    <p>{visible.length} 項欄位，{visible.filter((row) => row.value === null).length} 項待確認。</p>
    {visible.length ? <div className="table-wrap"><table>
      <caption>館舍、空間與欄位證據</caption>
      <thead><tr><th scope="col">館舍</th><th scope="col">空間</th><th scope="col">欄位</th>
        <th scope="col">目前資料</th><th scope="col">最後核對</th><th scope="col">核對紀錄與來源</th></tr></thead>
      <tbody>{visible.map((row) => <tr key={JSON.stringify([row.libraryId, row.area, row.field])}>
        <th scope="row"><Link href={{ pathname: '/admin/fields', query: { library: row.libraryId } }}>{row.library.name}</Link>
          {row.library.phone && <a className="audit-phone" href={'tel:' + row.library.phone}>{row.library.phone}</a>}
        </th>
        <td>{row.area || '館舍'}</td><td>{fieldLabels[row.field]}</td>
        <td>{row.value ?? <span className="badge unknown">待確認</span>}</td>
        <td>{row.review ? <time dateTime={row.review.checkedOn}>{row.review.checkedOn}</time> : '—'}</td>
        <td><Evidence review={row.review} sources={row.sources} /></td>
      </tr>)}</tbody>
    </table></div> : <p>沒有符合篩選條件的欄位。</p>}
    <h2 className="audit-history">匯入異動紀錄</h2>
    {history.length ? history.map(({ importedAt, changes }) => <details key={importedAt}>
      <summary><time dateTime={importedAt}>{taipeiDateTime.format(new Date(importedAt))}</time> · {changes.length} 項異動</summary>
      <div className="table-wrap"><table>
        <thead><tr><th scope="col">館舍</th><th scope="col">空間</th><th scope="col">欄位</th>
          <th scope="col">匯入前</th><th scope="col">匯入後</th></tr></thead>
        <tbody>{changes.map((change) => <tr key={JSON.stringify([change.libraryId, change.area, change.field])}>
          <th scope="row">{change.libraryName}</th><td>{change.area || '館舍'}</td><td>{fieldLabels[change.field]}</td>
          <td>{change.before ?? '尚未收錄'}{change.beforeReview && <Evidence review={change.beforeReview} showDate />}</td>
          <td>{change.after ?? '已移除'}{change.afterReview && <Evidence review={change.afterReview} showDate />}</td>
        </tr>)}</tbody>
      </table></div>
    </details>) : <p>目前沒有符合篩選條件的異動紀錄。</p>}
  </main>;
}

function Evidence({ review, sources = review?.sources ?? [], showDate }: {
  review?: FieldReview; sources?: string[]; showDate?: boolean;
}) {
  return <>
    {showDate && review && <div><time dateTime={review.checkedOn}>{review.checkedOn}</time></div>}
    {review && <div>{review.note}</div>}
    {sources.length > 0 && <details><summary>{review ? '欄位證據' : '館舍或空間參考來源'}</summary>
      <div className="source-links">{sources.map((source, i) =>
        <a key={source} href={source}>來源 {i + 1} ↗</a>)}</div>
    </details>}
  </>;
}
