import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import type { Library } from '../lib/study.ts';
import faxSupplements from './library-fax-supplements.json' with { type: 'json' };

const source = 'https://data.gov.tw/dataset/99567';
const download = 'https://plisnet.nlpi.edu.tw/api/API/LibraryInfoData';
const destination = new URL('../public/datasets/library-directory.json', import.meta.url);
const file = process.argv[2];
const raw = file ? await readFile(file) : await fetch(download, { signal: AbortSignal.timeout(30_000) }).then(async (response) => {
  if (!response.ok) throw new Error('官方名錄下載失敗：HTTP ' + response.status);
  return Buffer.from(await response.arrayBuffer());
});

type Region = {
  縣市: string;
  圖書館資訊: { Name: string; Address: string; Area: string; TEL?: string; FAX?: string; Latitude?: number; Longitude?: number; URL?: string }[];
};
const supplements: Record<string, { address: string; fax: string; source: string } | undefined> = faxSupplements;

const regions = JSON.parse(raw.toString('utf8')) as Region[];
const cities = new Set(regions.map((region) => region.縣市));
if (cities.size !== 22 || regions.length !== cities.size || regions.some((region) => !region.縣市 || !region.圖書館資訊?.length)) {
  throw new Error('官方名錄未涵蓋 22 個縣市');
}
const exclusions: { city: string; name: string; reason: string }[] = [];
const ids = new Set<string>();
const libraries: (Library & { city: string })[] = [];
for (const { 縣市: city, 圖書館資訊: records } of regions) {
  for (const row of records) {
    const name = row.Name.trim();
    if (name === '測試圖書館') {
      exclusions.push({ city, name, reason: '來源測試資料' });
      continue;
    }
    const id = 'plis-' + createHash('sha256').update(city + '\n' + name).digest('hex').slice(0, 20);
    if (!name || !row.Address.trim() || !row.Area.trim() || ids.has(id)) throw new Error('館舍欄位異常：' + city + ' ' + name);
    ids.add(id);
    const latitude = Number(row.Latitude);
    const longitude = Number(row.Longitude);
    const library: Library & { city: string } = {
      id, name, city, district: row.Area.trim(), address: row.Address.trim(),
      types: ['公共圖書館'], sources: [source],
      phone: row.TEL?.trim() || undefined,
      fax: row.FAX?.trim() || undefined,
      website: /^https?:\/\//i.test(row.URL?.trim() ?? '') ? row.URL?.trim() : undefined,
      coordinates: latitude >= 21 && latitude <= 27 && longitude >= 117 && longitude <= 123
        ? { latitude, longitude } : undefined,
      areas: [], closures: [],
    };
    const fax = supplements[id];
    if (!library.fax && fax?.address === library.address) {
      library.fax = fax.fax;
      library.sources.push(fax.source);
    }
    if (city === '嘉義縣' && name === '嘉義縣阿里山鄉立圖書館' && !library.website) {
      library.website = 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=012&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp';
      library.sources.push(library.website);
    }
    if (city === '高雄市' && name === '高雄市立圖書館鹽埕分館' &&
        library.address === '高雄市鹽埕區府北里中正四路274號1樓' && !library.coordinates) {
      // 交通局公布的是同址會議中心的座標。
      library.coordinates = { latitude: 22.626505, longitude: 120.286221 };
      library.sources.push('https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000402',
        'https://www.tbkc.gov.tw/FileOutput/Page/高雄市政府交通局路外停車場一覽表.pdf?id=3dff30f4-b62e-4a4a-8e01-d8d0a5ff55c1');
    }
    if (name === '苗栗縣竹南鎮立圖書館' && library.address === '苗栗縣竹南鎮中正路108號') {
      library.address = '苗栗縣竹南鎮大厝里真如路562號';
      library.phone = '037-463813';
      library.website = 'https://www.chunan.gov.tw/cp.aspx?n=11120';
      library.coordinates = undefined;
      library.fax = undefined;
      library.sources.push(library.website, 'https://www.miaoli.gov.tw/News_Content2.aspx?n=285&s=1005335');
    }
    libraries.push(library);
  }
}
if (new Set(libraries.map(({ city }) => city)).size !== 22 || libraries.length < 500) {
  throw new Error('正規化名錄的縣市或筆數異常');
}

const sha256 = createHash('sha256').update(raw).digest('hex');
const rawFile = 'plis-' + sha256.slice(0, 12) + '.json';
const metadata = {
  source, download, rawFile, sha256, collectedAt: new Date().toISOString(),
  rawCount: libraries.length + exclusions.length, count: libraries.length, exclusions,
  cityCounts: Object.fromEntries([...cities].map((city) => [city, libraries.filter((library) => library.city === city).length])),
};
const output = JSON.stringify(metadata, null, 2).slice(0, -2) + ',\n  "libraries": [\n' +
  libraries.map((library) => '    ' + JSON.stringify(library)).join(',\n') + '\n  ]\n}\n';
const rawTemporary = new URL(rawFile + '.' + process.pid + '.tmp', destination);
await writeFile(rawTemporary, raw);
await rename(rawTemporary, new URL(rawFile, destination));
const temporary = new URL('library-directory.' + process.pid + '.tmp', destination);
await writeFile(temporary, output);
await rename(temporary, destination);
console.log(`${cities.size} 個縣市、${libraries.length} 筆館舍，原始檔 ${rawFile}`);
