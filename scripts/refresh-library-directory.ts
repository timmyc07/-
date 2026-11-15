import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import type { Library } from '../lib/study.ts';

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
  圖書館資訊: { Name: string; Address: string; Area: string; TEL?: string; Latitude?: number; Longitude?: number; URL?: string }[];
};

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
    libraries.push({
      id, name, city, district: row.Area.trim(), address: row.Address.trim(),
      types: ['公共圖書館'], sources: [source],
      phone: row.TEL?.trim() || undefined,
      website: /^https?:\/\//i.test(row.URL?.trim() ?? '') ? row.URL?.trim() : undefined,
      coordinates: latitude >= 21 && latitude <= 27 && longitude >= 117 && longitude <= 123
        ? { latitude, longitude } : undefined,
      areas: [], closures: [],
    });
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
