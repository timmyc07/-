import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Library } from '../lib/study.ts';
import { withLibraryDetail, type LibraryDetail } from '../lib/library-details.ts';
import { coversCalendarYear, evaluate, minutes, validDate } from '../lib/study.ts';

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
  const library = directory.libraries.find(({ name }) => name === '基隆市公共圖書館中山分館')!;
  const detail: LibraryDetail = {
    address: '203 ' + library.address,
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000002',
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
  assert.equal(scheduled.length, 35);
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

test('雙北入座規則依館別套用，借閱證不可跨系統代用', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const get = (name: string) => {
    const library = directory.libraries.find((record) => record.name === name)!;
    return withLibraryDetail(library, details[library.id]);
  };
  const daoxiang = get('臺北市立圖書館稻香分館');
  const area = daoxiang.areas[0];
  assert.equal(area.seats, 93);
  const query = {
    date: '2026-11-15', start: minutes('14:00'), duration: 120,
    kind: 'study' as const, card: true, registration: true, required: [],
  };
  assert(evaluate(daoxiang, area, query).reasons.includes('需持臺北市圖個人借閱證'));
  assert.equal(evaluate(daoxiang, area, { ...query, regionalCards: ['taipei'] }).status, 'yes');
  const main = get('新北市立圖書館');
  assert(evaluate(main, main.areas[0], { ...query, registration: false, regionalCards: ['newTaipei'] })
    .reasons.includes('需現場登記'));
  const sanxia = get('新北市立圖書館三峽分館').areas[0];
  assert.equal(sanxia.access, 'walk-in');
  assert.equal(sanxia.equipment.outlet, false);
  assert.equal(get('新北市立圖書館三重東區分館').areas[0].equipment.outlet, undefined);
});

test('年度休館按館方範圍套用，部分開放與跨年時段各自判定', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.map((library) => withLibraryDetail(library, details[library.id]));
  for (const { closures } of libraries) {
    assert(closures.every(({ from, until }) => validDate(from) && (!until || validDate(until) && until >= from)));
  }
  const query = {
    date: '2027-02-09', start: minutes('14:00'), duration: 120,
    kind: 'study' as const, card: false, registration: true, required: [],
    regionalCards: ['taipei'] as const,
  };
  const taipei = libraries.find(({ name }) => name === '臺北市立圖書館稻香分館')!;
  const taipeiQuery = { ...query, regionalCards: [...query.regionalCards] };
  assert.equal(evaluate(taipei, taipei.areas[0], taipeiQuery).status, 'no');
  assert.equal(evaluate(taipei, taipei.areas[0], { ...taipeiQuery, date: '2027-02-10' }).status, 'yes');
  const newTaipei = libraries.find(({ name }) => name === '新北市立圖書館三峽分館')!;
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-11-28' }).status, 'no');
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-06-25' }).status, 'unknown');
  assert.equal(coversCalendarYear(newTaipei, 2027), false);
  const ntl = libraries.find(({ name }) => name === '國立臺灣圖書館')!;
  assert.equal(evaluate(ntl, ntl.areas[0], { ...taipeiQuery, date: '2026-02-20' }).status, 'unknown');
  assert.equal(coversCalendarYear(libraries.find(({ name }) => name === '新北市烏來區立圖書館')!, 2026), false);
  const dayuan = libraries.find(({ name }) => name === '桃園市立圖書館大園分館')!;
  assert.equal(dayuan.areas[0].seats, 147);
  const taoyuanQuery = { ...taipeiQuery, regionalCards: ['taoyuan' as const] };
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-26' }).status, 'no');
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).status, 'yes');
  const qiding = libraries.find(({ name }) => name === '桃園市立圖書館崎頂分館')!;
  assert.match(evaluate(qiding, qiding.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).closure!.reason, /搬遷/);
  const keelung = libraries.find(({ name }) => name === '基隆市公共圖書館總館')!;
  assert.equal(keelung.areas[0].regionalCard, 'keelung');
  assert.equal(keelung.areas[0].seats, 109);
  assert.equal(evaluate(keelung, keelung.areas[0], { ...taipeiQuery, date: '2026-02-21' }).status, 'no');
});
