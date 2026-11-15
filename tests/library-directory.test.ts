import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Library } from '../lib/study.ts';
import { withLibraryDetail, type LibraryDetail } from '../lib/library-details.ts';
import { evaluate, minutes } from '../lib/study.ts';

const root = new URL('../public/datasets/', import.meta.url);
const directory = JSON.parse(readFileSync(new URL('library-directory.json', root), 'utf8')) as {
  rawFile: string;
  sha256: string;
  count: number;
  rawCount: number;
  exclusions: { city: string; name: string }[];
  cityCounts: Record<string, number>;
  libraries: (Library & { city: string })[];
};

test('全臺名錄可追溯到原檔，保留 22 縣市且不填入未核對的空間規則', () => {
  const raw = readFileSync(new URL(directory.rawFile, root));
  const regions = JSON.parse(raw.toString('utf8')) as { 縣市: string; 圖書館資訊: { Name: string }[] }[];
  assert.equal(createHash('sha256').update(raw).digest('hex'), directory.sha256);
  assert.equal(regions.length, 22);
  assert.equal(regions.flatMap((region) => region.圖書館資訊).length, directory.rawCount);
  assert.equal(directory.libraries.length, directory.count);
  assert.equal(directory.count + directory.exclusions.length, directory.rawCount);
  assert.equal(new Set(directory.libraries.map(({ id }) => id)).size, directory.count);
  for (const region of regions) {
    const records = directory.libraries.filter((library) => library.city === region.縣市);
    const excluded = directory.exclusions.filter((item) => item.city === region.縣市).map(({ name }) => name);
    assert.equal(records.length, directory.cityCounts[region.縣市]);
    assert.deepEqual(records.map(({ name }) => name), region.圖書館資訊.map(({ Name }) => Name.trim())
      .filter((name) => !excluded.includes(name)));
    assert(records.every(({ areas, closures }) => areas.length === 0 && closures.length === 0));
  }
});

test('全臺名錄的電話、館方網址與座標齊全，補錄資料保留來源', () => {
  assert(directory.libraries.every(({ phone, website, coordinates }) => phone && website && coordinates));
  const alishan = directory.libraries.find(({ id }) => id === 'plis-e1773325972df453b6c4');
  assert(alishan?.website && alishan.sources.includes(alishan.website));
  const yancheng = directory.libraries.find(({ id }) => id === 'plis-4818cd57388587303882');
  assert.deepEqual(yancheng?.coordinates, { latitude: 22.626505, longitude: 120.286221 });
  assert(yancheng.sources.some((source) => new URL(source).hostname === 'www.tbkc.gov.tw'));
});

test('館舍詳情須同址，館舍開館及設備資料不當成自修室規則', () => {
  const library = directory.libraries[0];
  const detail: LibraryDetail = {
    address: '20241 ' + library.address,
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000001',
    hours: '週二至週六 09:00–21:00',
    facilities: ['自修室', '無線上網wifi'],
  };
  const enriched = withLibraryDetail(library, detail);
  assert.equal(enriched.openingHours, detail.hours);
  assert.equal(enriched.studyRoom, true);
  assert.deepEqual(enriched.areas, [{
    name: '自修室', kind: 'study', slots: null, access: null, equipment: {}, sources: [detail.url],
  }]);
  assert.equal(withLibraryDetail(library, { ...detail, address: '基隆市中正區信一路190號' }), library);
  assert.equal(withLibraryDetail(library, { ...detail, facilities: ['電梯'] }).studyRoom, undefined);
});

test('專室時段採館方資料，施工閉館可排除查詢', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.map((library) => withLibraryDetail(library, details[library.id]));
  const scheduled = libraries.flatMap(({ areas }) => areas).filter(({ slots }) => slots?.length);
  assert.equal(scheduled.length, 27);
  for (const { slots } of scheduled) {
    assert.equal(new Set(slots!.map(({ day }) => day)).size, slots!.length);
    assert(slots!.every(({ day, start, end }) => day >= 0 && day <= 6 && start < end && end <= 1440));
  }
  const pingzhen = libraries.find(({ id }) => id === 'plis-07c47313a8f5b473d2bf')!;
  assert.deepEqual(pingzhen.areas[0].slots?.find(({ day }) => day === 0),
    { day: 0, start: minutes('08:30'), end: minutes('17:00') });
  const huangbin = libraries.find(({ id }) => id === 'plis-eb5cc227330385ea9b00')!;
  const result = evaluate(huangbin, undefined, {
    date: '2026-11-15', start: minutes('14:00'), duration: 120, kind: 'study', card: false, registration: false, required: [],
  });
  assert.equal(result.status, 'no');
  assert.equal(result.closure?.from, '2026-03-02');
});
