import { taichungSnapshot } from '../../../lib/mongodb.ts';
import { coverageGaps } from '../../../lib/study.ts';

function csvCell(value: string) {
  const safe = /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export async function GET() {
  let snapshot;
  try {
    snapshot = await taichungSnapshot();
  } catch {
    return new Response('目前無法連線至 MongoDB', { status: 503 });
  }
  if (!snapshot) return new Response('臺中資料尚未匯入', { status: 404 });
  const rows = [['館舍', '行政區', '地址', '電話', '館方網站', '待核對欄位', '規則核對狀態', '館方規則與說明', '官方來源']];
  for (const library of snapshot.libraries) {
    const gaps = coverageGaps(library);
    if (!gaps.length) continue;
    rows.push([library.name, library.district, library.address, library.phone ?? '', library.website ?? '',
      gaps.join('、'), library.reviewNote ?? '', library.accessNote ?? '',
      [...new Set([...library.sources, ...(library.ruleLinks ?? []), ...library.areas.flatMap((area) => area.sources)])].join(' ')]);
  }
  return new Response('\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="taichung-library-gaps.csv"',
    },
  });
}
